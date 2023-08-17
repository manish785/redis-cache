const express = require('express');
const redis = require('redis');
const fetch = require('node-fetch');

const port = 8080;
const app = express();

// const client = redis.createClient(6379);


// create and connect redis client to local instance.
const client = redis.createClient({
    legacyMode: true
});

// redis errors to the console
client.on('error', (err) => {
    console.log('Error: ' + err.message);
});

// get list of photos
app.get('/photos', async(req, res) => {
    const photosRedisKey = 'user:photos';

    // Try fetching the result from Redis first if in the case it is Cached
     await client.get(photosRedisKey, async (err, cachedPhotos) => {
        // if (err) {
        //     console.error(err);
        //     return res.status(500).json({ error: 'An error occurred' });
        // }
        //console.log(cachedPhotos);

        // If that key present in the redis 
        if (cachedPhotos) {
            return res.json({ source: 'cache', data: JSON.parse(cachedPhotos) });
        } 
        // If that key does not present in the redis 
        else {
            try {
                // here, fetching the data directly from URL
                const response = await fetch('https://jsonplaceholder.typicode.com/photos');
                const photos = await response.json();
               // console.log(photos);

                await client.setex(photosRedisKey, 3600, JSON.stringify(photos));
               
                return res.json({ source: 'api', data: photos });
            } catch (error) {
                console.log(error);
                return res.status(500).json({ error: 'An error occurred' });
            }
        }
    });
});

app.listen(port, () => {
    console.log(`Server is listening on ${port}`);
});
