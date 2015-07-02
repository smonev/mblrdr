mblrdr - a mobile rss reader
======

Intended Use
======

> RSS is best for following a large number of infrequently updated
> sites: sites thatyou’d never remember to check every day because they
> only post occasionally, and that your social-network friends won’t
> reliably find or link to.

http://www.marco.org/2013/03/26/power-of-rss

Mblrdr runs on Google App Engine and is using React and react-router. Google App Engine have some free tier so you can install it to check it out.

How to install and setup your own 
======

1. Go to appengine.com and register (if you don't have registration).

2. In appengine.com add a python app. Choose defautls and remember the app name (handler).

3. Download and unzip the mblrdr.zip

4. Open app.yaml and set replace 'ENTER YOUR APPLICATION NAME HERE' with your name from 2)

5. Upload to appengine by opening cmd prompt and write: "appcfg.py update mblrdr"
(asuming the app.yaml file is in mblrdr folder and asuming you have python in your path)

6. go to yourappname.appspot.com and start reading feeds

Google are changing things quickly in their App Engine interface, so if something is different, please open an issue so I can update the docs.

GO RSS :)