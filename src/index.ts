import http from 'http'
import fs from 'fs'
import users from '../MOCK_DATA.json'
import url from 'url'

type user = {
    id: number,
    first_name: string,
    last_name: string,
    email: string,
    gender: string,
    job_title: string
}

let userList: user[] = users as user[];


const server = http.createServer((req, res) => {

    if (req.method === 'GET') {
        fs.readFile('MOCK_DATA.json', (err, data) => {
            if (err) {
                res.end("error while reading the file")
            }
            res.statusCode = 200;
            res.end(data);
        });
    }

    if (req.method === 'POST') {
        let body = '';
        // Collect incoming data
        req.on('data', (chunk) => {
            body += chunk.toString();
        });
        // When data is fully received
        req.on('end', () => {
            try {
                const parsedBody = JSON.parse(body);
                const newUser: user = { ...parsedBody, id: users.length + 1 };

                userList.push(newUser); // Add to existing data

                fs.writeFile('MOCK_DATA.json', JSON.stringify(userList, null, 2), (err) => {
                    if (err) {
                        res.statusCode = 500;
                        return res.end('Error writing to file');
                    }

                    res.statusCode = 201;
                    res.end(JSON.stringify(newUser));
                });
            } catch (err) {
                res.statusCode = 400;
                res.end('Invalid JSON');
            }
        })
    }

    if (req.method === 'DELETE') {
        const myURL = url.parse(req.url || '', true);
        const id = myURL.query.id;
        const parsedID = parseInt(id as string);

        const index = userList.findIndex((user) => user.id === parsedID);

        if (index === -1) {
            res.statusCode = 404;
            return res.end(`User with ID ${parsedID} not found`);
        }

        userList.splice(index, 1);

        fs.writeFile('MOCK_DATA.json', JSON.stringify(userList, null, 2), (err) => {
            if (err) {
                res.statusCode = 500;
                return res.end('Error deleting a record');
            }

            res.statusCode = 200;
            res.end(`User with ID ${parsedID} deleted successfully`);
        });
    }


    if (req.method === 'PATCH') {
        const myURL = url.parse(req.url || '', true);
        const id = myURL.query.id;
        const parsedID = parseInt(id as string);

        let body = '';

        req.on('data', (chunk) => {
            body += chunk.toString();
        });

        req.on('end', () => {
            const parsedBody = JSON.parse(body);
            const userIndex = users.findIndex((user) => user.id === parsedID);

            userList[userIndex] = {
                ...userList[userIndex],
                ...parsedBody,
            };

            fs.writeFile('MOCK_DATA.json', JSON.stringify(users, null, 2), (err) => {
                if (err) {
                    res.statusCode = 500;
                    return res.end('Error writing to file');
                }

                res.statusCode = 200;
                res.end(`User with ID ${parsedID} updated successfully`);
            });

        });
    }

})
server.listen(3000, () => {
    console.log("server running on Port 3000");
})