import React, { useState, useEffect } from 'react';
import { Rate, Button, Input, message } from 'antd';
import { SubmitRating, GetDoctorById } from '../../apicalls/doctors';

const { TextArea } = Input;

const RatingComponent = ({ doctorId, userId, appointmentId, onComplete }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [alreadyRated, setAlreadyRated] = useState(false);

  useEffect(() => {
    const checkIfRated = async () => {
      try {
        const doctorData = await GetDoctorById(doctorId);
        const userHasRated = doctorData.data?.ratings?.some(
          (r) => r.userId === userId
        );
        if (userHasRated) {
          setAlreadyRated(true);
          localStorage.setItem(`rated_${doctorId}_${userId}`, 'true');
        }
      } catch (error) {
        message.error("Error fetching rating data.");
      }
    };

    // Initial check
    checkIfRated();

    // Additional re-check after component re-renders (e.g., after UI reappears)
    return () => {
      checkIfRated();
    };
  }, [doctorId, userId]);

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
      onComplete(appointmentId); // Notify parent to update rated appointments
      setAlreadyRated(true);
      localStorage.setItem(`rated_${doctorId}_${userId}`, 'true');
    } else {
      message.error(response.message);
    }
  };

  if (alreadyRated) {
    return <div>You have already rated this doctor.</div>;
  }

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
