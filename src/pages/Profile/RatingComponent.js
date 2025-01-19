import React, { useState, useEffect } from 'react';
import { Rate, Button, Input, message } from 'antd';
import { SubmitRating, GetDoctorById } from '../../apicalls/doctors';

const { TextArea } = Input;

// ============================================
// 1. Profanity List
// ============================================
// Customize this list with words you want to block.
// IMPORTANT: Because this approach checks for whole words,
//            "bitching" or "bitchy" won't be flagged unless
//            you also include them in the list.
const PROFANITY_LIST = [
  'shit',
  'bitch',
  'damn',
  'crap',
  'asshole',
  'fuck',
  'hell'
  // Add or remove words as needed
];

// ============================================
// 2. Profanity Check Function
// ============================================
// This function returns true if any profane word is found.
const containsProfanity = (text) => {
  if (!text) return false;

  // 2.1. Convert to lower case to ensure case-insensitive comparison
  let lowerText = text.toLowerCase();

  // 2.2. Remove punctuation and special characters (except for alphanumeric and space)
  //      This ensures "bitch!" becomes "bitch"
  lowerText = lowerText.replace(/[^\w\s]/g, '');

  // 2.3. Split into words by whitespace
  const words = lowerText.split(/\s+/);

  console.log('=== Debug Profanity Check ===');
  console.log('Original:', text);
  console.log('Lowercase, Punctuation-Stripped:', lowerText);
  console.log('Words Array:', words);

  // 2.4. Check if any word is in our profanity list
  return words.some((word) => PROFANITY_LIST.includes(word));
};

// ============================================
// RatingComponent
// ============================================
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
        message.error('Error fetching rating data.');
      }
    };

    // Initial check
    checkIfRated();

    return () => {
      // Any necessary cleanup
    };
  }, [doctorId, userId]);

  const handleSubmit = async () => {
    if (!rating) {
      message.error('Please provide a rating.');
      return;
    }

    // 3. Check for profanity with our custom function
    if (containsProfanity(comment)) {
      message.error('Your comment contains inappropriate language. Please revise.');
      console.log('Profanity detected. Submission halted.');
      return;
    }

    // 4. If no profanity, proceed with submitting the rating
    setLoading(true);
    const response = await SubmitRating(doctorId, userId, rating, comment);
    setLoading(false);

    if (response.success) {
      message.success('Rating submitted successfully.');
      onComplete(appointmentId);
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

      {/* 
        Optional Debug Button to Manually Test the containsProfanity() function.
        This can help you see if "bitch" is correctly detected in various forms.
        Remove/comment this out in production.
      */}
      <Button
        type="dashed"
        style={{ marginTop: '8px', marginLeft: '8px' }}
        onClick={() => {
          const testStrings = [
            'bitch',
            'bitch!',
            'BITCH',
            'This is a bitch comment',
            'Hello world',
            'Damn, this is great!',
            'She is a BITCH.',
            'bitching',
            'bitchy',
            'b!tch',
          ];
          testStrings.forEach((str) => {
            const result = containsProfanity(str);
            console.log(`"${str}" -> ${result}`);
          });
        }}
      >
        Test Profanity Filter
      </Button>
    </div>
  );
};

export default RatingComponent;
