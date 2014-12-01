# presentr

This is an attempt to build an HTML5 presentation framework

## Current State
There is a lot left to do, but here are some things that work so far:
* slide generation from markdown files (still very basic)
* speakerview with timer
* syncing of slide decks accross multiple devices

## How to
If you wanna try presentr, just clone this repo and run
```
npm install && bower install
```
to install all dependencies. To start the application run
```
npm start
```
and visit http://localhost:3000 in your browser.

There is one demo slide deck that comes with this repo. Once you have it open, you can press 'm' on your keyboard to reveal the slide deck menu.

### Speakerview
The speakerview is what you may want to open on your laptop during the presentation. It will show you the current slide, as well as a preview of the next slide. The additional control panel offers you a timer that will notify you if you are running out of time during your presentation (the claimed time limit can be set as metadata inside the presentation file).

### Syncing slides
To sync a slide deck between different browser windows, open the menu and select 'Connect to session'. All slide decks that are synced to the session will be updated when moving between slides.
