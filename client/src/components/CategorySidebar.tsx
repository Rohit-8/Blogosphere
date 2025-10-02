import React from 'react';
import { Button } from 'react-bootstrap';

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface CategorySidebarProps {
  categories: Category[];
  selectedCategory: string;
  postCounts: Record<string, number>;
  totalPosts: number;
  isCollapsed: boolean;
  onToggle: () => void;
  onCategoryChange: (categoryId: string) => void;
}

const CategorySidebar: React.FC<CategorySidebarProps> = ({
  categories,
  selectedCategory,
  postCounts,
  totalPosts,
  isCollapsed,
  onToggle,
  onCategoryChange,
}) => {
  return (
    <div className="sidebar-sticky-explore">
      <Button
        variant="outline-primary"
        size="sm"
        onClick={onToggle}
        className="sidebar-toggle-btn"
        title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
      >
        <i className={`fas fa-${isCollapsed ? 'chevron-right' : 'chevron-left'}`}></i>
      </Button>

      <div className="sidebar-content">
        <div
          className={`sidebar-category-item ${selectedCategory === 'all' ? 'active' : ''}`}
          onClick={() => onCategoryChange('all')}
          title="All Posts"
        >
          <div className="category-icon">
            <i className="fas fa-th-large"></i>
          </div>
          {!isCollapsed && (
            <div className="category-details">
              <div className="category-name">All Posts</div>
              <div className="category-count">{totalPosts}</div>
            </div>
          )}
        </div>

        {categories.map(category => {
          const count = postCounts[category.id] || 0;
          return (
            <div
              key={category.id}
              className={`sidebar-category-item ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => onCategoryChange(category.id)}
              title={category.name}
            >
              <div className="category-icon">
                <i className={category.icon}></i>
              </div>
              {!isCollapsed && (
                <div className="category-details">
                  <div className="category-name">{category.name}</div>
                  <div className="category-count">{count}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CategorySidebar;
