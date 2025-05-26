@echo off

cd C:\inetpub\wwwroot\SCADA\LayoutFactory

npx json-server --watch db.json --port 3000 --host 0.0.0.0