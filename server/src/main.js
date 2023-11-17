const http = require('http');
const path = require('path');
const fs = require('fs');
const fsAsync = require('fs/promises');
const multer = require('multer');
const mkdirp = require('mkdirp');

const express = require('express');

const app = express();
const httpServer = http.createServer(app);

const publicDir = path.join(__dirname, `../../public`);

const PORT = process.env.PORT || 3000;

console.log('A', path.join(__dirname, '../../public'));
app.get('/', express.static(path.join(__dirname, '../../public')));

const alreadyAccounts = new Set();

function handleError(error, res) {
  console.error(error);

  res.status(500).contentType('text/plain').end('Oops! Something went wrong!');
}

const upload = multer({
  dest: path.join(__dirname, '../uploads-temp'),
  // you might also want to set some limits: https://github.com/expressjs/multer#limits
});

app.post(
  '/upload',
  upload.single('file' /* name attribute of <file> element in your form */),
  async (req, res) => {
    const { accountName, index } = req.body;

    const tempPath = req.file.path;

    if (req.file.mimetype !== 'image/png') {
      fs.unlink(tempPath, (error) => {
        if (error) {
          handleError(error, res);
          return;
        }

        res
          .status(403)
          .contentType('text/plain')
          .end('Only .png files are allowed!');
      });
      return;
    }

    const accountDir = path.join(publicDir, accountName);

    await mkdirp.mkdirp(accountDir);

    const targetPath = path.join(accountDir, `f${index}.png`);

    try {
      await fsAsync.rename(tempPath, targetPath);
    } catch (error) {
      handleError(error, res);
      return;
    }

    if (!alreadyAccounts.has(accountName)) {
      alreadyAccounts.add(accountName);

      const accountsPath = path.join(publicDir, 'accounts.json');

      const accountsJson = await fsAsync.readFile(accountsPath, 'utf-8');
      const data = JSON.parse(accountsJson);

      const set = new Set(data.accounts);
      set.add(accountName);
      data.accounts = [...set.keys()];

      await fsAsync.writeFile(accountsPath, JSON.stringify(data));
    }

    res.status(200).contentType('text/plain').end('File uploaded!');
  },
);

httpServer.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

// put the HTML file containing your form in a directory named "public" (relative to where this script is located)
