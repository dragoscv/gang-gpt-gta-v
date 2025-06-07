# Start the server with index.ts instead of server.ts to ensure both tRPC and REST APIs are running
cd ..
Write-Host "Starting Gang-GPT server using index.ts (REST APIs + tRPC)"
node --require ts-node/register ./src/index.ts
