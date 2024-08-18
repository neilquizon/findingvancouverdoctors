import React, { useState } from 'react';
import { Rate, Button, Input, message } from 'antd';
import { SubmitRating } from '../../apicalls/doctors';

const { TextArea } = Input;

const RatingComponent = ({ doctorId, userId, appointmentId, onComplete }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!rating) {
      message.error("Please provide a rating.");
      return;
    }
    setLoading(true);
    const response = await SubmitRating(doctorId, userId, rating, comment);
    setLoading(false);
    if (response.success) {
      message.success("Rating submitted successfully.");
      onComplete(appointmentId);
    } else {
      message.error(response.message);
    }
  };

  return (
    <div>
      <Rate onChange={(value) => setRating(value)} value={rating} />
      <TextArea
        rows={4}
        placeholder="Add a comment (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        style={{ marginTop: '8px' }}
      />
      <Button
        type="primary"
        onClick={handleSubmit}
        loading={loading}
        style={{ marginTop: '8px' }}
      >
        Submit Rating
      </Button>
    </div>
  );
};

export default RatingComponent;
