import { useState, useEffect } from 'react';

export const useChatState = (properties, setExposedVariables) => {
  const [chatTitle, setChatTitle] = useState(properties.chatTitle);
  const [userName, setUserName] = useState(properties.userName);
  const [userAvatar, setUserAvatar] = useState(properties.userAvatar);
  const [respondentName, setRespondentName] = useState(properties.respondentName);
  const [respondentAvatar, setRespondentAvatar] = useState(properties.respondentAvatar);
  const [visibility, setVisibility] = useState(properties.visibility);
  const [loadingResponse, setLoadingResponse] = useState(properties.loadingResponse);
  const [loadingHistory, setLoadingHistory] = useState(properties.loadingHistory);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState(properties.initialChat || []);
  const [newMessageDisabled, setNewMessageDisabled] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setChatHistory(properties.initialChat);
    setExposedVariables({ history: properties.initialChat });
  }, [properties.initialChat]);

  useEffect(() => setUserName(properties.userName), [properties.userName]);
  useEffect(() => setUserAvatar(properties.userAvatar), [properties.userAvatar]);
  useEffect(() => setRespondentName(properties.respondentName), [properties.respondentName]);
  useEffect(() => setRespondentAvatar(properties.respondentAvatar), [properties.respondentAvatar]);
  useEffect(() => setChatTitle(properties.chatTitle), [properties.chatTitle]);

  useEffect(() => {
    setLoadingResponse(properties.loadingResponse);
    setExposedVariables({ isReplyLoading: properties.loadingResponse });
  }, [properties.loadingResponse]);

  useEffect(() => {
    setLoadingHistory(properties.loadingHistory);
    setExposedVariables({ isHistoryLoading: properties.loadingHistory });
  }, [properties.loadingHistory]);

  useEffect(() => {
    setVisibility(properties.visibility);
    setExposedVariables({ isVisible: properties.visibility });
  }, [properties.visibility]);

  return {
    chatTitle,
    setChatTitle,
    userName,
    setUserName,
    userAvatar,
    setUserAvatar,
    respondentName,
    setRespondentName,
    respondentAvatar,
    setRespondentAvatar,
    visibility,
    setVisibility,
    loadingResponse,
    setLoadingResponse,
    loadingHistory,
    setLoadingHistory,
    message,
    setMessage,
    chatHistory,
    setChatHistory,
    newMessageDisabled,
    setNewMessageDisabled,
    error,
    setError,
    properties,
  };
};
