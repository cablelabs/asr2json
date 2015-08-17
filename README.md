# asr2json
asr2json is a converter that takes in the ATIS ASOG PDF Spec and produces JSON.

For more information about the converter: https://github.com/cablelabs/asr2json/wiki

> **IMPORTANT**: This project is in pre-release development. Please expect frequent changes and updates while we converge on our initial release.

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

Navigate to the asr2json directory
```
cd asr2json/algorithm
```

This is the command to run. Replace fileName with the name of the pdf containing the spec. Replace startingPage and endingPage with the pages from the pdf which you want to be converted. 
```
node asr2json.js fileName startingPage endingPage
```
