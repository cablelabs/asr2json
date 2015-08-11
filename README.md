# asr2json
asr2json is a converter that takes in the ASR PDF Spec and produces JSON.

* For more information about the converter: https://github.com/cablelabs/asr2json/wiki

##Setup

###Install Node.js

For instructions:
* https://nodejs.org/download/

```
node -v
```
* This command will give the version of Node js installed.

###Install pdf2json module
* https://github.com/modesty/pdf2json

###Clone the repository
Open the terminal. Use the "cd" command to navigate to the desired directory. Clone the git repository (git required)

```
git clone https://github.com/cablelabs/asr2json.git
```

##Run

* Navigate to the asr2json directory
```
cd asr2json
```

* This is the command to run. Replace fileName with the name of the pdf containing the spec. Replace startingPage and endingPage with the pages from the pdf which you want to be converted. 
```
node asr2json.js fileName startingPage endingPage
```
