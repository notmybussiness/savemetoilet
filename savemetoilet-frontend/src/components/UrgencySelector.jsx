import { Button, ButtonGroup } from 'react-bootstrap';
import { toiletService } from '../services/toiletService';

const UrgencySelector = ({ selectedUrgency, onUrgencyChange, className }) => {
  const urgencyLevels = ['emergency', 'moderate', 'relaxed'];

  return (
    <div className={className}>
      <h6 className="mb-3 text-center">얼마나 급하세요?</h6>
      <ButtonGroup className="w-100" vertical={window.innerWidth < 768}>
        {urgencyLevels.map((level) => {
          const config = toiletService.getUrgencyConfig(level);
          return (
            <Button
              key={level}
              variant={selectedUrgency === level ? config.color : 'outline-' + config.color}
              onClick={() => onUrgencyChange(level)}
              className="mb-2 mb-md-0 py-3"
              size="lg"
            >
              <div className="d-flex flex-column align-items-center">
                <div className="fs-5 mb-1">{config.label}</div>
                <small className="text-muted">{config.description}</small>
              </div>
            </Button>
          );
        })}
      </ButtonGroup>
    </div>
  );
};

export default UrgencySelector;