To deploy:

- do a get latest on appakin and appakin-web repos.
- cd to appakin/deploy dir.
- run the following: 'bash ./build-deployment.sh xxxx' where xxxx is your username on the production server, e.g. 'steve'.
- ssh to the production server: 'ssh -i ../../appakin-azure.key steve@dapap.cloudapp.net'
- check what the next version number needs to be: 'ls /mnt/data/www/appakin/releases', e.g. 0.0.18
- run the following: 'sudo bash ./server-deployment.sh xxxx' where xxxx is the next version number, e.g., 0.0.18
  (Don't add a 'v' at the start.)