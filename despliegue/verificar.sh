#!/bin/sh
# Pruebas de humo después de cada despliegue: ./verificar.sh https://bienestar.ejemplo.gov.co
set -u
URL=${1:?Indique la dirección pública, por ejemplo https://bienestar.ejemplo.gov.co}
FALLAS=0
probar() {
  if eval "$2" > /dev/null 2>&1; then echo "Correcto: $1"; else echo "FALLA:    $1"; FALLAS=$((FALLAS + 1)); fi
}
probar "la interfaz responde por HTTPS" "curl -fsS $URL/ | grep -q '<app-root'"
probar "el servicio de aplicación y la base responden" "curl -fsS $URL/api/health | grep -q '\"database\":\"up\"'"
probar "la configuración de ingreso es pública" "curl -fsS $URL/api/auth/config | grep -q registration"
probar "las rutas protegidas exigen sesión" "test \$(curl -s -o /dev/null -w '%{http_code}' $URL/api/farms) = 401"
probar "HTTP redirige a HTTPS" "curl -sI http://\${URL#https://}/ | grep -qi '^location: https://'"
probar "se envía la política de seguridad de contenido" "curl -sI $URL/ | grep -qi content-security-policy"
probar "la base no está expuesta en el puerto 3306" "! nc -z -w 3 \${URL#https://} 3306"
[ "$FALLAS" -eq 0 ] && echo "Despliegue verificado." || { echo "$FALLAS prueba(s) fallaron."; exit 1; }
