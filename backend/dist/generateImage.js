"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBingImage = void 0;
const axios_1 = __importDefault(require("axios"));
function getBingImage(search) {
    return __awaiter(this, void 0, void 0, function* () {
        const apiKey = process.env.BING_KEY;
        const searchTerm = encodeURIComponent(search); // Replace with your search term
        const count = 1; // Number of results to retrieve
        try {
            const response = yield axios_1.default.get(`https://api.bing.microsoft.com/v7.0/images/search?q=${searchTerm}&count=${count}`, {
                headers: {
                    'Ocp-Apim-Subscription-Key': apiKey,
                },
            });
            // Check if the response status is OK (status code 200)
            if (response.status === 200) {
                const images = response.data.value;
                if (images.length > 0) {
                    const firstImage = images[0];
                    const imageUrl = firstImage.thumbnailUrl;
                    return imageUrl;
                }
                else {
                    console.log("No images found!");
                    return "";
                }
            }
            else {
                console.error('Request failed with status:', response.status);
            }
        }
        catch (error) {
            console.error(error);
        }
    });
}
exports.getBingImage = getBingImage;
