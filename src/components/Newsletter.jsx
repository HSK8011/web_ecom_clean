import React from 'react';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';

const Newsletter = () => {
  return (
    <section className="newsletter py-5 bg-dark text-white">
      <Container>
        <Row className="justify-content-center">
          <Col md={8} lg={6} className="text-center">
            <h2 className="display-6 fw-bold mb-4">STAY UP TO DATE ABOUT OUR LATEST OFFERS</h2>
            <Form className="d-flex gap-2">
              <Form.Control
                type="email"
                placeholder="Enter your email address"
                className="rounded-pill py-2 px-3"
              />
              <Button variant="light" className="rounded-pill px-4">
                Subscribe to Newsletter
              </Button>
            </Form>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default Newsletter; 