# asr2json
asr2json is a converter that takes in the ASR PDF Spec and produces JSON.

* For more information about the converter: https://github.com/cablelabs/asr2json/wiki

##Setup

###Install Node.js

For instructions:
* https://nodejs.org/download/

* To check if nodejs has been installed correctly:
```
node -v
```
* This command will give the version of Node js installed.

###Install pdf2json module globally

```
sudo npm install pdf2json -g
```
* To check if pdf2json has been installed correctly:
```
pdf2json -v
```


* For more information about pdf2json module: https://github.com/modesty/pdf2json

###Clone the repository
Open the terminal. Use the "cd" command to navigate to the desired directory. Clone the git repository (git required)

```
git clone https://github.com/cablelabs/asr2json.git
```

##Run

* Navigate to the asr2json directory
```
cd asr2json/algorithm
```

* This is the command to run. Replace fileName with the name of the pdf containing the spec. Replace startingPage and endingPage with the pages from the pdf which you want to be converted. 
```
node asr2json.js fileName startingPage endingPage
```
