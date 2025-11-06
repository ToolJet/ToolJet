export const blobToDataURL = (blob) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => resolve(reader.result);
    });
};

export const blobToBinary = (blob) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsBinaryString(blob);
        reader.onloadend = () => resolve(reader.result);
    });
};
