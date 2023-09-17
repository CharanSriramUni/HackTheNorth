import axios from 'axios';

export async function getBingImage(search: string) {
    const apiKey = process.env.BING_KEY;
    const searchTerm = encodeURIComponent(search); // Replace with your search term
    const count = 1; // Number of results to retrieve
    try {

        const response = await axios.get(
        `https://api.bing.microsoft.com/v7.0/images/search?q=${searchTerm}&count=${count}`,
        {
            headers: {
            'Ocp-Apim-Subscription-Key': apiKey,
            },
        }
        );

        // Check if the response status is OK (status code 200)
        if (response.status === 200) {
            const images = response.data.value;
            
            if (images.length > 0) {
                const firstImage = images[0];
                const imageUrl = firstImage.thumbnailUrl;
                return imageUrl
            } else {
                console.log("No images found!")
                return "";
            }
        } else {
            console.error('Request failed with status:', response.status);
        }
    } catch (error) {
        console.error(error);
    }
}

