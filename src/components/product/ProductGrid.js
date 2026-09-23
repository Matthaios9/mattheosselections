import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import ProductCard from './ProductCard';

const COLS = { xs: 6, md: 4, xl: 3 };
const SIZES = '(min-width: 1400px) 310px, (min-width: 1200px) 22vw, (min-width: 768px) 31vw, 48vw';

/** Responsive grid of product cards: two per row on phones, four on large screens. */
export default function ProductGrid({ products, preloadCount = 0 }) {
  return (
    <Row className="g-3 g-md-4 row-gap-4 row-gap-md-5">
      {products.map((product, index) => (
        <Col key={product.id} {...COLS}>
          <ProductCard product={product} imageSizes={SIZES} preload={index < preloadCount} />
        </Col>
      ))}
    </Row>
  );
}
