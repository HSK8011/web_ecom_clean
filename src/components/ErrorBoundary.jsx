import React, { Component } from 'react';
import styled from 'styled-components';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorContainer>
          <h1>Something went wrong</h1>
          <ErrorDetails>
            <ErrorMessage>{this.state.error && this.state.error.toString()}</ErrorMessage>
            <ErrorStack>
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </ErrorStack>
          </ErrorDetails>
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

const ErrorContainer = styled.div`
  padding: 2rem;
  margin: 2rem auto;
  max-width: 800px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  h1 {
    color: #e53e3e;
    margin-top: 0;
  }
`;

const ErrorDetails = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background-color: #f7fafc;
  border-radius: 4px;
  border-left: 4px solid #e53e3e;
`;

const ErrorMessage = styled.div`
  font-weight: bold;
  margin-bottom: 0.5rem;
`;

const ErrorStack = styled.pre`
  white-space: pre-wrap;
  font-family: monospace;
  font-size: 0.9rem;
  color: #4a5568;
  background-color: #edf2f7;
  padding: 1rem;
  border-radius: 4px;
  overflow: auto;
  max-height: 300px;
`;

export default ErrorBoundary; 