import { Card, Button, Badge, Row, Col } from 'react-bootstrap';
import { locationService } from '../services/locationService';
import { toiletService } from '../services/toiletService';

const ToiletCard = ({ toilet, userLocation }) => {
  const qualityInfo = toiletService.getQualityDescription(toilet.quality_score);
  const walkTime = locationService.calculateWalkTime(toilet.distance);

  const handleNavigation = () => {
    locationService.openKakaoNavigation(
      toilet.coordinates.lat,
      toilet.coordinates.lng,
      toilet.name
    );
  };

  const getUrgencyColor = (urgencyMatch) => {
    switch (urgencyMatch) {
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'secondary';
    }
  };

  return (
    <Card className="mb-3 shadow-sm">
      <Card.Body>
        <Row className="align-items-center">
          <Col xs={8}>
            <div className="d-flex align-items-center mb-2">
              <Badge 
                bg={getUrgencyColor(toilet.urgency_match)} 
                className="me-2"
              >
                {toilet.urgency_match === 'high' ? '🔴' : 
                 toilet.urgency_match === 'medium' ? '🟡' : '🟢'}
              </Badge>
              <h6 className="mb-0">{toilet.name}</h6>
            </div>
            
            <div className="text-muted mb-2">
              <small>
                🚶‍♂️ {walkTime}분 거리 ({toilet.distance}m) | {' '}
                <span className={`text-${qualityInfo.color}`}>
                  {qualityInfo.level}
                </span>
              </small>
            </div>

            <div className="text-muted mb-2">
              <small>📍 {toilet.address}</small>
            </div>

            <div className="d-flex flex-wrap gap-1">
              {toilet.is_free ? (
                <Badge bg="success" className="me-1">무료</Badge>
              ) : (
                <Badge bg="warning" className="me-1">구매필요</Badge>
              )}
              
              {toilet.facilities?.disabled_access && (
                <Badge bg="info" className="me-1">휠체어 접근</Badge>
              )}
              
              {toilet.facilities?.baby_changing && (
                <Badge bg="info" className="me-1">기저귀교환</Badge>
              )}
              
              {toilet.facilities?.separate_gender && (
                <Badge bg="secondary" className="me-1">남녀분리</Badge>
              )}
            </div>
          </Col>
          
          <Col xs={4} className="text-end">
            <Button 
              variant="primary" 
              size="sm" 
              onClick={handleNavigation}
              className="w-100 mb-2"
            >
              길찾기
            </Button>
            
            {toilet.phone && (
              <Button 
                variant="outline-secondary" 
                size="sm"
                href={`tel:${toilet.phone}`}
                className="w-100"
              >
                📞 전화
              </Button>
            )}
          </Col>
        </Row>

        {toilet.hours && (
          <Row className="mt-2">
            <Col xs={12}>
              <small className="text-muted">
                🕐 {toilet.hours}
              </small>
            </Col>
          </Row>
        )}
      </Card.Body>
    </Card>
  );
};

export default ToiletCard;