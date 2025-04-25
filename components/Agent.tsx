'use client';

import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { vapi } from '@/lib/vapi.sdk';
import { interviewer } from '@/constants';
import { createFeedback } from '@/lib/actions/general.action';

enum CallStatus {
  INACTIVE = 'INACTIVE',
  CONNECTING = 'CONNECTING',
  ACTIVE = 'ACTIVE',
  FINISHED = 'FINISHED',
}

interface SavedMessage {
  role: 'user' | 'system' | 'assistant';
  content: string;
}

const Agent = ({
  userName,
  userId,
  type,
  interviewId,
  questions,
}: AgentProps) => {
  const router = useRouter();

  //Track whether the Ai is speaking
  const [isSpeaking, setIsSpeaking] = useState(false);

  //Track at what stage the call is in
  const [callStatus, setCallStatus] = useState<CallStatus>(
    CallStatus.INACTIVE
  );

  //Saved transcript from the call
  const [messages, setMessages] = useState<SavedMessage[]>(
    []
  );

  useEffect(() => {
    //Updates the call state when a call starts or ends.
    const onCallStart = () =>
      setCallStatus(CallStatus.ACTIVE);

    const onCallEnd = () =>
      setCallStatus(CallStatus.FINISHED);

    //When transcript is final , save it to message state
    const onMessage = (message: Message) => {
      if (
        message.type === 'transcript' &&
        message.transcriptType === 'final'
      ) {
        const newMessage = {
          role: message.role,
          content: message.transcript,
        };

        setMessages((prev) => [...prev, newMessage]);
      }
    };

    //Changing speaking state as per the speech by AI
    const onSpeechStart = () => setIsSpeaking(true);
    const onSpeechEnd = () => setIsSpeaking(false);

    //Log error if occurred any
    const onError = (error: Error) =>
      console.log('Error', error);

    vapi.on('call-start', onCallStart);
    vapi.on('call-end', onCallEnd);
    vapi.on('message', onMessage);
    vapi.on('speech-start', onSpeechStart);
    vapi.on('speech-end', onSpeechEnd);
    vapi.on('error', onError);

    return () => {
      vapi.off('call-start', onCallStart);
      vapi.off('call-end', onCallEnd);
      vapi.off('message', onMessage);
      vapi.off('speech-start', onSpeechStart);
      vapi.off('speech-end', onSpeechEnd);
      vapi.off('error', onError);
    };
  }, []);

  const handleGenerateFeedback = async (
    messages: SavedMessage[]
  ) => {
    console.log('Generate feedback here');

    const { success, feedbackId: id } =
      await createFeedback({
        interviewId: interviewId!,
        userId: userId!,
        transcript: messages,
      });

    if (success && id) {
      router.push(`/interview/${interviewId}/feedback`);
    } else {
      console.log(`Error saving feedback`);
      router.push('/');
    }
  };


  useEffect(() => {
    if (callStatus === CallStatus.FINISHED) {
      if (type === 'generate') {
        router.push('/');
      } else {
        handleGenerateFeedback(messages);
      }
    }
  }, [messages, callStatus, type, userId]);

  const handleCall = async () => {
    setCallStatus(CallStatus.CONNECTING);

    if (type === 'generate') {
      await vapi.start(
        process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID!,
        {
          variableValues: {
            username: userName,
            userid: userId,
          },
        }
      );
    } else {
      let formattedQuestions = '';
      if (questions) {
        formattedQuestions = questions
          .map((question) => `- ${question}`)
          .join('\n');
      }

      await vapi.start(interviewer, {
        variableValues: {
          questions: formattedQuestions,
        },
      });
    }
  };

  const handleDisconnect = async () => {
    setCallStatus(CallStatus.FINISHED);
    vapi.stop();
  };

  //Last Index of the transcript array 
  const lastMessage =
    messages[messages.length - 1]?.content;

  //Boolean to check if all is inactive or finished
  const isCallInactiveOrFinished =
    callStatus === CallStatus.INACTIVE ||
    callStatus === CallStatus.FINISHED;

  return (
    <>
      <div className="call-view">
        <div className="card-interviewer">
          <div className="avatar">
            <Image
              src="/ai-avatar.png"
              alt="vapi"
              width={65}
              height={54}
              className="object-cover"
            />
            {isSpeaking && (
              <span className="animate-speak" />
            )}
          </div>

          <h3>AI Interviewer</h3>
        </div>

        <div className="card-border">
          <div className="card-content">
            <Image
              src="/user-avatar.png"
              alt="user avatar"
              width={540}
              height={540}
              className="rounded-full object-cover size-[120px]"
            />

            <h3>{userName}</h3>
          </div>
        </div>
      </div>

      {/* Show Last Message Said by Either AI Or User */}
      {messages.length > 0 && (
        <div className="transcript-border">
          <div className="transcript">
            <p
              key={lastMessage}
              className={cn(
                'transition-opacity duration-500 opacity-0',
                'animate-fadeIn opacity-100'
              )}
            >
              {lastMessage}
            </p>
          </div>
        </div>
      )}

      {/* Show Call or End  Button as per the call status */}
      <div className="w-full flex justify-center">
        {callStatus !== 'ACTIVE' ? (
          <button
            className="relative btn-call"
            onClick={handleCall}
          >
            {/* Show ping animation when call is connecting */}
            <span
              className={cn(
                'absolute animate-ping rounded-full opacity-75 ',
                callStatus !== 'CONNECTING' && 'hidden'
              )}
            />

            {/* Show call button if call is inactive or finished otherwise ... if call is in progress */}
            <span>
              {isCallInactiveOrFinished ? 'Call' : '. . .'}
            </span>
          </button>
        ) : (
          <button
            className="btn-disconnect"
            onClick={handleDisconnect}
          >
            End
          </button>
        )}
      </div>
    </>
  );
};

export default Agent;
