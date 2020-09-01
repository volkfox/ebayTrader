#/bin/bash

if [ $# -ne 1 ]
then
 echo "Need item id as parameter"
 exit 1
fi
cat getid > id
echo $1 >> id
curl -K id | xmllint --format -
