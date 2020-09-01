#/bin/bash
# e-mail script for new ebay items
cd ~/ebay
touch old
/usr/local/bin/gdate --date='+1 hours'  -u +"%Y-%m-%dT%H:%M:%SZ" | tr -d '\n' > auction.time
# update auction searches
cat a.before auction.time a.after > a
cat retina.before auction.time retina.after > retina.a
# 17-inch MBP 2011 "buy now $600<"
#curl -sK r | xmllint --format - | grep viewItemURL > temp
#curl -sK w | xmllint --format - | grep viewItemURL >> temp
#curl -sK a | xmllint --format - | grep viewItemURL >> temp
# 15-inch MBP Retina 16GB "buy now, auction $800<"
curl -sK retina | xmllint --format - | grep viewItemURL >> temp
#curl -sK retina.a | xmllint --format - | grep viewItemURL >> temp
# Any touch bar "buy now $900<"
curl -sK touchbar | xmllint --format - | grep viewItemURL >> temp
#curl -sK touchbar.w | xmllint --format - | grep viewItemURL >> temp

cat temp | sed -e 's/<viewItemURL>\(.*\)<\/viewItemURL>/<a href="\1">\1<\/a><br>/' | sort -u > candidates
comm -23 candidates old > not_seen

if [ -s "not_seen" ]
then
  cat header not_seen footer > last.html
  if [ $# -eq 1 ]
  then
    cat last.html 
  else
    cat header not_seen footer | /usr/local/bin/mutt -e "set content_type=text/html" -s "New laptops" dkharito@stanford.edu 
  fi
else
  if [ $# -eq 1 ]
  then
     echo "no updates (:"
  fi
fi

cat not_seen old | sort -u > temp
mv temp old 
rm candidates
rm not_seen


