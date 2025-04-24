import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

const CustomerReviews = () => {
  const reviews = [
    {
      id: 1,
      name: 'Sarah M.',
      rating: 5,
      text: 'I\'m blown away by the quality and style of the clothes I received. The attention to detail and the fit are perfect. Will definitely be a returning customer!',
      verified: true
    },
    {
      id: 2,
      name: 'Alex K.',
      rating: 5,
      text: 'The shopping experience was seamless, and the clothes exceeded my expectations. The fabric quality is outstanding, and the prices are very reasonable.',
      verified: true
    },
    {
      id: 3,
      name: 'James L.',
      rating: 5,
      text: 'Finally found my go-to online store for all my fashion needs. The selection is fantastic, and the customer service is top-notch.',
      verified: true
    },
    {
      id: 4,
      name: 'Michael R.',
      rating: 5,
      text: 'Great quality products and fast shipping. The clothes fit perfectly and look exactly like the pictures. Highly recommend!',
      verified: true
    }
  ];

  return (
    <section className="customer-reviews py-5">
      <Container>
        <h2 className="text-center display-6 fw-bold mb-4">OUR HAPPY CUSTOMERS</h2>
        <Row>
          {reviews.map((review) => (
            <Col key={review.id} xs={12} sm={6} md={3} className="mb-4">
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      {[...Array(review.rating)].map((_, index) => (
                        <FontAwesomeIcon 
                          key={index} 
                          icon={faStar} 
                          className="text-warning me-1" 
                        />
                      ))}
                    </div>
                    {review.verified && (
                      <small className="text-success">✓ Verified</small>
                    )}
                  </div>
                  <Card.Text className="mb-3">{review.text}</Card.Text>
                  <div className="d-flex align-items-center">
                    <div className="bg-secondary rounded-circle me-2" style={{ width: 32, height: 32 }}></div>
                    <strong>{review.name}</strong>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
        <div className="text-center mt-4">
          <button className="btn btn-outline-dark rounded-circle me-2">
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <button className="btn btn-outline-dark rounded-circle">
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      </Container>
    </section>
  );
};

export default CustomerReviews; 