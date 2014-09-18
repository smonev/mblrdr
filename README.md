mblrdr
======

How to setup your own mblrdr rss reader?

1. Go to appengine.com and register (if you don't have registration).

2. After registering, add a python app. Choose defautls and remember the app name.  

3. Download and unzip the mblrdr.zip

4. Open app.yaml and set replace 'ENTER YOUR APPLICATION NAME HERE' with your name from 2)

5. Upload appengine by opening cmd prompt and write: "appcfg.py update mblrdr"  
  (asuming the app.yaml file is in mblrdr folder)
  (asuming you have python in your path)

6. go to yourappname.appspot.com and you are ready.