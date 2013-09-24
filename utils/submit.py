#!/usr/bin/env python

"""
A simple server script that accepts POST requests for HTTPS Everywhere
bug reports generated by report-disable.js and posts the data to
./log.csv.

This is currently live at http://zyan.scripts.mit.edu/submit_report/submit.py

Author: Yan Zhu, yan@mit.edu
"""

import cgi
import cgitb
import csv
import time
import os

form = cgi.FieldStorage()
fields = ['rulename', 'commit_id', 'comment', 'os', 'app_name', 'app_version', 'ext_version']
field_arr = [time.time()]+map(form.getvalue, fields)

def write_csv():
    with open('log.csv','a') as f:
        w = csv.writer(f, quoting=csv.QUOTE_ALL, lineterminator=';\r\n')
        w.writerow(field_arr)

try:
    if os.environ['REQUEST_METHOD'] == 'POST':
        write_csv()
except:
    write_csv()

print "Content-type: text/html\n"
print """
<html>
<body>
"""
print "only taking post requests sry"
print
"""
</body>
<!-- Generate data that looks like an Apache log -->
<img src="http://scripts.mit.edu/~zyan/zyan_log.pl?uri=
<!--#echo var="DOCUMENT_URI" -->&amp;ref=
<!--#echo var="HTTP_REFERER" -->&amp;met=
<!--#echo var="REQUEST_METHOD" -->&amp;pro=
<!--#echo var="SERVER_PROTOCOL" -->"
width="1" height="1" alt="fake image for tracking"/>
</html>
"""
