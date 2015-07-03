mblrdr - a rss reader for your mobile
======

Mblrdr runs on Google App Engine and is using react and react-router.

Intended Use
======

> RSS is best for following a large number of infrequently updated
> sites: sites that you’d never remember to check every day because they
> only post occasionally

http://www.marco.org/2013/03/26/power-of-rss

Demo
======
You can check it out in readonly mode here, google account needed:
[demo](http://demo.fdjsfkdsfhkjdshfkjsdhfkjsdhkj.appspot.com)


How to install and setup your own 
======

Google App Engine have some free tier so you can install it to check it out.

1. Go to https://appengine.google.com/ and register if you do not have registration.

2. Add a python app, choose defaults and remember the app name (handler).

3. Download and unzip the mblrdr.zip (or clone this repository)

4. Open mblrdr.yaml and set replace 'ENTER YOUR APPLICATION NAME HERE' with your app name from 2.

5. Upload to appengine by opening cmd prompt and write: "appcfg.py update mblrdr"
(assuming the app.yaml file is in mblrdr folder and assuming you have python in your path)

6. go to yourappname.appspot.com and start reading feeds

GO RSS :)