#!/bin/sh

host=${1:-192.168.1.154}
shift
random_number=$(( RANDOM % 101 ))
vol=${1:-$random_number}
shift

echo "host: $host"
echo "vol: $vol"

curl "http://$host:1400/MediaRenderer/RenderingControl/Control" \
  -X 'POST' \
  -H 'Accept: */*' \
  -H 'Accept-Language: en-US,en;q=0.9' \
  -H 'Cache-Control: no-cache' \
  -H 'Connection: keep-alive' \
  -H 'Content-Type: text/xml' \
  -H 'SoapAction: "urn:schemas-upnp-org:service:RenderingControl:1#SetVolume"' \
  -H 'DNT: 1' \
  -H 'Origin: http://localhost:8000' \
  -H 'Pragma: no-cache' \
  -H 'Referer: http://localhost:8000/' \
  -H 'Upgrade-Insecure-Requests: 1' \
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36' \
  -d "<s:Envelope xmlns:s=\"http://schemas.xmlsoap.org/soap/envelope/\" s:encodingStyle=\"http://schemas.xmlsoap.org/soap/encoding/\"><s:Body><u:SetVolume xmlns:u=\"urn:schemas-upnp-org:service:RenderingControl:1\"><InstanceID>0</InstanceID><Channel>Master</Channel><DesiredVolume>$vol</DesiredVolume></u:SetVolume></s:Body></s:Envelope>"