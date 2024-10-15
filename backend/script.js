const fs = require('fs');
const path = require('path');

// Directory path
const directory = path.join(__dirname, 'uploads/avatars');

// Read the directory
fs.readdir(directory, (err, files) => {
    if (err) throw err;

    for (const file of files) {
        const filePath = path.join(directory, file);

        // Delete the file
        fs.unlink(filePath, err => {
            if (err) throw err;
            console.log(`${file} was deleted`);
        });
    }
});
