# Offline Wikipedia

This is a demo to a client-side offline version of wikipedia using ES6 service worker.
Because this was programmed for an university project in germany, all user-visible text is in german and the demo uses the german wikipedia only.
Code is in english though, so it should be understandable :wink:

## Installation
Make sure [Node.js and NPM](https://nodejs.org) are properly installed and updated.

Install Gulp-CLI globally:
    
    npm install gulp-cli -g
    
From Git:
    
    git clone https://github.com/carlomorgenstern/offline-wiki.git
    cd offline-wiki
    npm install
    
## Usage
Live demo at https://carlomorgenstern.github.io/offline-wiki/

For development use (BrowserSync is configured):
    
    gulp serve

For production use:
    
    gulp --type=prod build
    
 As of now (May 2015), uglifying ES6-enabled javascript is broken, because UglifyJS2 does not support ES6 yet.

## Contributing

You can suggest improvements or submit a PR in the usual procedure, but I probably won't push this code much further.
Feel free to fork it and use it for your projects, at you own risk though.

## License

This software is provided under the MIT License.