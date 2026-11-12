#!/usr/bin/env bash
set -euo pipefail

usage() {
  printf 'Usage: %s <user@server> [domain] [template commit message]\n' "$0" >&2
  printf 'Example: %s root@example-server studio.so.gl\n' "$0" >&2
  printf 'Optional: set CERTBOT_EMAIL for certificate expiry notifications.\n' >&2
}

if (($# < 1 || $# > 3)); then usage; exit 1; fi
server=$1
domain=${2:-studio.so.gl}
commit_message=${3:-Update template catalog}
certificate_email=${CERTBOT_EMAIL:-}
repo_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
templates_dir="$repo_dir/templates"
site_root="/var/www/$domain"

fail() { printf 'Deployment error: %s\n' "$*" >&2; exit 1; }
[[ $server =~ ^([A-Za-z0-9][A-Za-z0-9._-]*@)?[A-Za-z0-9][A-Za-z0-9.-]*$ ]] || fail 'Invalid server address.'
[[ $domain =~ ^[A-Za-z0-9][A-Za-z0-9.-]*$ && $domain != *'..'* ]] || fail 'Invalid domain.'
[[ -z $certificate_email || $certificate_email =~ ^[A-Za-z0-9._+@-]+$ ]] || fail 'Invalid CERTBOT_EMAIL.'
[[ $(git -C "$repo_dir" branch --show-current) == main ]] || fail 'Switch to main before deploying.'
repository=$(git -C "$repo_dir" remote get-url origin)
if [[ ! $repository =~ ^https://[A-Za-z0-9._/-]+$ && ! $repository =~ ^[A-Za-z0-9._-]+@[A-Za-z0-9._-]+:[A-Za-z0-9._/-]+$ ]]; then
  fail 'Origin must be an HTTPS URL without embedded credentials, or an SSH URL.'
fi

# Keep the existing template-catalog workflow, but refuse unrelated changes
# before staging or committing anything.
non_template_changes=$(git -C "$repo_dir" status --porcelain --untracked-files=all -- . ':(exclude)templates' ':(exclude)templates/**')
[[ -z $non_template_changes ]] || fail "Commit non-template changes before deploying:
$non_template_changes"

server_host=${server#*@}
if [[ $server_host =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]] && command -v dig >/dev/null 2>&1; then
  dns_addresses=$(dig +short +time=5 +tries=1 "$domain" A)
  printf '%s\n' "$dns_addresses" | grep -Fxq "$server_host" || fail "$domain does not resolve to $server_host. Check DNS before requesting HTTPS."
fi

python3 - "$templates_dir" <<'PY'
import json
import sys
from pathlib import Path

templates_dir = Path(sys.argv[1])
folders = sorted(path.name for path in templates_dir.iterdir()
                 if path.is_dir() and (path / 'config.json').is_file())
manifest = templates_dir / 'manifest.json'
content = json.dumps(folders, ensure_ascii=False, indent=2) + '\n'
if not manifest.exists() or manifest.read_text(encoding='utf-8') != content:
    manifest.write_text(content, encoding='utf-8')
PY

git -C "$repo_dir" add -- templates
if ! git -C "$repo_dir" diff --cached --quiet -- templates; then
  git -C "$repo_dir" commit -m "$commit_message" -- templates
fi
[[ -z $(git -C "$repo_dir" status --porcelain) ]] || fail 'The working tree is not clean.'
revision=$(git -C "$repo_dir" rev-parse HEAD)

git -C "$repo_dir" push origin main
ssh -o BatchMode=yes -o ConnectTimeout=10 "$server" \
  bash -s -- "$domain" "$site_root" "$repository" "$revision" "$certificate_email" <<'REMOTE'
set -euo pipefail

domain=${1:?Missing domain}
site_root=${2:?Missing site directory}
repository=${3:?Missing repository URL}
revision=${4:?Missing commit}
certificate_email=${5:-}

fail() { printf 'Deployment error: %s\n' "$*" >&2; exit 1; }

[[ $(id -u) -eq 0 ]] || fail 'Connect as root to install and configure server packages.'
[[ $domain =~ ^[A-Za-z0-9][A-Za-z0-9.-]*$ ]] || fail 'Invalid domain.'
[[ $site_root =~ ^/var/www/[A-Za-z0-9._/-]+$ && $site_root != *'..'* ]] || fail 'Invalid site directory.'
[[ $revision =~ ^[a-f0-9]{40}$ ]] || fail 'Invalid commit.'
if [[ ! $repository =~ ^https://[A-Za-z0-9._/-]+$ && ! $repository =~ ^[A-Za-z0-9._-]+@[A-Za-z0-9._-]+:[A-Za-z0-9._/-]+$ ]]; then
  fail 'Repository URL must be HTTPS without embedded credentials, or an SSH URL.'
fi
[[ -z $certificate_email || $certificate_email =~ ^[A-Za-z0-9._+@-]+$ ]] || fail 'Invalid certificate email.'

missing_packages=()
for pair in git:git nginx:nginx certbot:certbot curl:curl openssl:openssl; do
  command -v "${pair%%:*}" >/dev/null 2>&1 || missing_packages+=("${pair#*:}")
done
if ((${#missing_packages[@]})); then
  command -v apt-get >/dev/null 2>&1 || fail 'Automatic package installation requires Debian or Ubuntu.'
  export DEBIAN_FRONTEND=noninteractive
  apt-get update
  apt-get install -y --no-install-recommends "${missing_packages[@]}"
fi

if [[ -e $site_root && ! -d $site_root/.git ]]; then
  fail "$site_root already exists and is not a Git checkout. It was not changed."
fi
if [[ -d $site_root/.git ]]; then
  [[ $(git -C "$site_root" remote get-url origin) == "$repository" ]] || fail 'Server checkout has a different origin.'
  [[ -z $(git -C "$site_root" status --porcelain) ]] || fail 'Server checkout has uncommitted changes.'
  [[ $(git -C "$site_root" branch --show-current) == main ]] || fail 'Server checkout is not on main.'
  GIT_TERMINAL_PROMPT=0 git -C "$site_root" fetch origin main
  [[ $(git -C "$site_root" rev-parse FETCH_HEAD) == "$revision" ]] || fail 'Remote main changed during deployment.'
  git -C "$site_root" merge --ff-only "$revision"
else
  mkdir -p "$(dirname "$site_root")"
  GIT_TERMINAL_PROMPT=0 git clone --branch main --single-branch "$repository" "$site_root"
  [[ $(git -C "$site_root" rev-parse HEAD) == "$revision" ]] || fail 'Cloned main differs from the requested commit.'
fi

nginx_dir=/etc/nginx/sites-available
nginx_config="$nginx_dir/$domain"
nginx_link="/etc/nginx/sites-enabled/$domain"
certificate="/etc/letsencrypt/live/$domain/fullchain.pem"
private_key="/etc/letsencrypt/live/$domain/privkey.pem"
marker='Managed by Photobooth Template Studio deployment.'

[[ -d $nginx_dir && -d /etc/nginx/sites-enabled ]] || fail 'Nginx sites-available/sites-enabled directories are missing.'
if [[ -e $nginx_config ]]; then
  [[ -f $nginx_config && ! -L $nginx_config ]] || fail 'The Nginx site configuration is not a regular file.'
  grep -Fq "$marker" "$nginx_config" || fail "$nginx_config exists but is not managed by this deployment."
fi
if [[ -e $nginx_link || -L $nginx_link ]]; then
  [[ -L $nginx_link && $(readlink -f "$nginx_link") == "$(readlink -f "$nginx_config")" ]] || fail "$nginx_link points to a different configuration."
fi

if ! systemctl is-active --quiet nginx; then
  nginx -t
  systemctl enable --now nginx
fi
nginx -t
mkdir -p /var/lib/letsencrypt/.well-known/acme-challenge

install_nginx_config() {
  local template=$1 candidate previous link_created=0
  candidate=$(mktemp)
  previous=$(mktemp)
  sed -e "s|__DOMAIN__|$domain|g" -e "s|__SITE_ROOT__|$site_root|g" "$template" > "$candidate"

  if [[ -f $nginx_config ]] && cmp -s "$candidate" "$nginx_config" && [[ -L $nginx_link ]]; then
    rm -f "$candidate" "$previous"
    return
  fi

  if [[ -f $nginx_config ]]; then cp -p "$nginx_config" "$previous"; else rm -f "$previous"; fi
  install -m 644 "$candidate" "$nginx_config"
  if [[ ! -L $nginx_link ]]; then
    ln -s "$nginx_config" "$nginx_link"
    link_created=1
  fi
  if ! nginx -t || ! systemctl reload nginx; then
    if [[ -f $previous ]]; then cp -p "$previous" "$nginx_config"; else rm -f "$nginx_config"; fi
    if ((link_created)); then rm -f "$nginx_link"; fi
    nginx -t && systemctl reload nginx || true
    rm -f "$candidate" "$previous"
    fail 'Nginx rejected the new configuration; the previous configuration was restored.'
  fi
  rm -f "$candidate" "$previous"
}

have_certificate=false
if [[ -e $certificate || -e $private_key ]]; then
  [[ -s $certificate && -s $private_key ]] || fail 'Existing certificate files are incomplete.'
  openssl x509 -in "$certificate" -noout -checkhost "$domain" >/dev/null || fail 'Existing certificate does not match the domain.'
  have_certificate=true
fi

if $have_certificate; then
  install_nginx_config "$site_root/deploy/nginx.conf"
else
  bootstrap=$(mktemp)
  cat > "$bootstrap" <<'NGINX_BOOTSTRAP'
# Managed by Photobooth Template Studio deployment.
server {
    listen 80;
    listen [::]:80;
    server_name __DOMAIN__;

    root __SITE_ROOT__;
    index index.html;

    location ^~ /.well-known/acme-challenge/ {
        root /var/lib/letsencrypt;
        try_files $uri =404;
    }

    location ~ /\. {
        deny all;
    }

    location ^~ /deploy/ { return 404; }
    location = /deploy.sh { return 404; }

    location / {
        try_files $uri $uri/ =404;
    }
}
NGINX_BOOTSTRAP
  install_nginx_config "$bootstrap"
  rm -f "$bootstrap"
fi

if ! $have_certificate || ! openssl x509 -in "$certificate" -checkend 2592000 -noout >/dev/null; then
  certbot_args=(certonly --webroot -w /var/lib/letsencrypt -d "$domain" --cert-name "$domain" --non-interactive --agree-tos --keep-until-expiring --no-eff-email)
  if [[ -n $certificate_email ]]; then
    certbot_args+=(--email "$certificate_email")
  else
    certbot_args+=(--register-unsafely-without-email)
    echo 'No certificate email configured; expiration emails will not be sent.'
  fi
  certbot "${certbot_args[@]}"
  [[ -s $certificate && -s $private_key ]] || fail 'Certbot did not create the expected certificate files.'
  openssl x509 -in "$certificate" -noout -checkhost "$domain" >/dev/null || fail 'Issued certificate does not match the domain.'
  install_nginx_config "$site_root/deploy/nginx.conf"
  nginx -t && systemctl reload nginx
fi

mkdir -p /etc/letsencrypt/renewal-hooks/deploy
hook="/etc/letsencrypt/renewal-hooks/deploy/photobooth-$domain"
cat > "$hook" <<EOF
#!/usr/bin/env bash
set -euo pipefail
if [[ \${RENEWED_LINEAGE:-} == /etc/letsencrypt/live/$domain ]]; then
  nginx -t && systemctl reload nginx
fi
EOF
chmod 755 "$hook"
if systemctl list-unit-files certbot.timer --no-legend 2>/dev/null | grep -q '^certbot.timer'; then
  systemctl enable --now certbot.timer
fi

curl --noproxy '*' --fail --silent --show-error --resolve "$domain:443:127.0.0.1" "https://$domain/" -o /dev/null
printf 'Deployed %s to https://%s/\n' "$revision" "$domain"
REMOTE
