import React from 'react';
import { Form, InputGroup, Button } from 'react-bootstrap';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  placeholder?: string;
  resultCount?: number;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  placeholder = 'Search by title, content, category, tags, or author...',
  resultCount,
}) => {
  return (
    <div className="search-section">
      <InputGroup className="search-input-group">
        <InputGroup.Text>
          <i className="fas fa-search"></i>
        </InputGroup.Text>
        <Form.Control
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
        />
        {searchQuery && (
          <Button 
            variant="outline-secondary" 
            onClick={() => onSearchChange('')}
            title="Clear search"
          >
            <i className="fas fa-times"></i>
          </Button>
        )}
      </InputGroup>
      {searchQuery && resultCount !== undefined && (
        <div className="search-results-info">
          <small className="text-muted">
            {resultCount} result{resultCount !== 1 ? 's' : ''}
          </small>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
