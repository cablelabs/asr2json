# asr2json
asr2json is a converter that takes in the ATIS ASOG PDF Spec and produces JSON.

> **IMPORTANT**: This project is in pre-release development. Please expect frequent changes and updates while we converge on our initial release.

For more information about the converter: https://github.com/cablelabs/asr2json/wiki

##Setup

###Install Node.js

To check if Node.js is already installed or to check if it has been installed correctly:
```
node -v
```
If you're installing Node.js for the firest time, please see: https://nodejs.org/

###Install pdf2json module

Install pdf2json module globally
```
sudo npm install pdf2json -g
```
To check if pdf2json has been installed correctly:
```
pdf2json -v
```
For more information about pdf2json module: https://github.com/modesty/pdf2json

###Clone the repository
Open the terminal. Use the "cd" command to navigate to the desired directory. Clone the git repository (git required)

```
git clone https://github.com/cablelabs/asr2json.git
```

##Run
```
cd asr2json
node index.js path-to-asr.pdf path-to-output-directory start-page stop-page 
```

This is the command to run. Replace fileName with the name of the pdf containing the spec. Replace start-page and end-page with the pages from the pdf which you want to be converted.  A directory matching the form name will be created in the output directory specified, and that form directory will contain json files matching the field names.  The output directory will be created if it doesn't exist.

##Require
asr2json isn't published to npm, so to require it in node, you will need to clone the repo inside of your node_modules directory

from within you project:
```
cd node_modules
git clone https://github.com/cablelabs/asr2json.git
```

in your nodejs file
```
var asr2json = require('./node_modules/asr2json/index.js');

asr2json('path-to-asr.pdf', 'path-to-output-directory', startPage, stopPage);
```

## Contribute

If you want to contribute, just [fork](https://help.github.com/articles/fork-a-repo/) this repo and then send us a [pull request](https://help.github.com/articles/using-pull-requests/) when your contribution is complete.

## Other important stuff

We use an [MIT License](https://github.com/cablelabs/asr2json/blob/master/LICENSE.md).

Questions? Just send us an email at btech@cablelabs.com.
