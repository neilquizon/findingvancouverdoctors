import React, { useState } from 'react';
import axios from 'axios';

const CloudinaryUpload = () => {
  const [image, setImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  const uploadImage = async () => {
    const formData = new FormData();
    formData.append('file', image);
    formData.append('upload_preset', 'findingvancouverdoctor'); // Replace with your upload preset name

    setLoading(true);

    try {
      const res = await axios.post(
        `https://api.cloudinary.com/v1_1/djibhmgu6/image/upload`, // Replace with your Cloudinary cloud name
        formData
      );
      setImageUrl(res.data.secure_url);
      setLoading(false);
    } catch (error) {
      console.error('Error uploading image:', error);
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        name="file"
        onChange={(e) => setImage(e.target.files[0])}
      />
      <button onClick={uploadImage}>Upload Image</button>
      {loading ? (
        <h3>Uploading...</h3>
      ) : (
        imageUrl && <img src={imageUrl} alt="Uploaded" style={{ width: '300px' }} />
      )}
    </div>
  );
};

export default CloudinaryUpload;
