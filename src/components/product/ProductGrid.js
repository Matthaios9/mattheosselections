import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import ProductCard from './ProductCard';

const LAYOUTS = {
  four: { cols: { xs: 6, md: 4, xl: 3 }, sizes: '(min-width: 1200px) 22vw, (min-width: 768px) 31vw, 48vw' },
  three: { cols: { xs: 6, lg: 4 }, sizes: '(min-width: 992px) 24vw, 48vw' },
};

/** Responsive grid of product cards. `layout="three"` is used next to the shop sidebar. */
export default function ProductGrid({ products, layout = 'four', preloadCount = 0 }) {
  const { cols, sizes } = LAYOUTS[layout];

  return (
    <Row className="g-3 g-md-4 row-gap-4 row-gap-md-5">
      {products.map((product, index) => (
        <Col key={product.id} {...cols}>
          <ProductCard product={product} imageSizes={sizes} preload={index < preloadCount} />
        </Col>
      ))}
    </Row>
  );
}
