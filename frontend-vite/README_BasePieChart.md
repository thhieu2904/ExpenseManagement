# BasePieChart Component Documentation

## Overview

The `BasePieChart` component is a highly reusable, customizable, and visually consistent pie chart component built on top of Recharts. It provides a modern card design with comprehensive customization options suitable for various data visualization needs throughout the application.

## Features

- ✅ **Reusable Design**: Single component for all pie chart needs
- ✅ **Modern Card UI**: Beautiful gradient background, rounded corners, and shadow
- ✅ **Customizable Title**: Support for chart title with consistent styling
- ✅ **Details Link**: Configurable action button positioned at bottom-right
- ✅ **Multiple Chart Options**: Support for labels, tooltips, center labels, and active shapes
- ✅ **Loading & Error States**: Built-in loading spinner and error message handling
- ✅ **Responsive Design**: Adapts to different screen sizes
- ✅ **Accessibility**: Proper ARIA labels and keyboard navigation support

## Usage

### Basic Usage

```jsx
import BasePieChart from '../Common/BasePieChart';

const MyComponent = () => {
  const data = [
    { id: 1, name: "Category A", value: 400, icon: "fa-chart", color: "#0088FE" },
    { id: 2, name: "Category B", value: 300, icon: "fa-bar-chart", color: "#00C49F" },
    { id: 3, name: "Category C", value: 200, icon: "fa-pie-chart", color: "#FFBB28" },
  ];

  return (
    <BasePieChart
      title="Sample Pie Chart"
      data={data}
      total={900}
      loading={false}
      error={null}
      detailsLink={{
        url: "/details",
        text: "View Details",
        title: "View detailed information"
      }}
    />
  );
};
```

### Advanced Usage with Full Customization

```jsx
<BasePieChart
  title="Advanced Chart Example"
  data={chartData}
  total={totalValue}
  loading={isLoading}
  error={errorMessage}
  onSliceClick={handleSliceClick}
  activeCategoryId={selectedCategoryId}
  activeCategoryName={selectedCategoryName}
  showCenterLabel={true}
  showLabels={true}
  showTooltip={true}
  showActiveShape={true}
  colors={['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4']}
  chartConfig={{
    innerRadius: 80,
    outerRadius: 120,
    paddingAngle: 2,
    height: 400,
  }}
  labelConfig={{
    fontSize: 12,
    activeFontSize: 14,
    fontWeight: 600,
    activeFontWeight: 700,
    labelRadius: 60,
    activeLabelRadius: 60,
  }}
  detailsLink={{
    url: "/transactions",
    text: "View Transactions",
    title: "View all related transactions"
  }}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | - | Chart title displayed at the top |
| `data` | `array` | `[]` | Array of data objects with id, name, value, icon, color properties |
| `total` | `number` | `0` | Total value for center label calculation |
| `loading` | `boolean` | `false` | Shows loading spinner when true |
| `error` | `string` | `null` | Error message to display |
| `onSliceClick` | `function` | - | Callback function when slice is clicked: `(data, index) => {}` |
| `activeCategoryId` | `string/number` | `null` | ID of currently active/selected category |
| `activeCategoryName` | `string` | `null` | Name of currently active category |
| `showCenterLabel` | `boolean` | `true` | Show total value in center of chart |
| `showLabels` | `boolean` | `true` | Show percentage labels on slices |
| `showTooltip` | `boolean` | `true` | Enable hover tooltips |
| `showActiveShape` | `boolean` | `true` | Highlight active slice with enlarged radius |
| `colors` | `array` | Default palette | Custom color array for chart slices |
| `chartConfig` | `object` | Default config | Chart dimensions and styling configuration |
| `labelConfig` | `object` | Default config | Label styling and positioning configuration |
| `detailsLink` | `object` | `null` | Details link configuration: `{url, text, title}` |

### chartConfig Object

```jsx
{
  innerRadius: 80,      // Inner radius of donut chart
  outerRadius: 120,     // Outer radius of chart
  paddingAngle: 2,      // Gap between slices in degrees
  height: 400,          // Chart container height
}
```

### labelConfig Object

```jsx
{
  fontSize: 12,           // Default label font size
  activeFontSize: 14,     // Active label font size
  fontWeight: 600,        // Default label font weight
  activeFontWeight: 700,  // Active label font weight
  labelRadius: 60,        // Distance of labels from center
  activeLabelRadius: 60,  // Distance of active labels from center
}
```

### detailsLink Object

```jsx
{
  url: "/path/to/details",    // Link URL
  text: "View Details",       // Link text
  title: "Tooltip message"    // Link title/tooltip
}
```

## Current Implementations

The BasePieChart component is currently being used in:

1. **CategoryExpenseChart** (`src/components/DetailedAnalyticsSection/CategoryExpenseChart.jsx`)
   - Used in Statistics Page and Detailed Analytics Section
   - Shows expense breakdown by category
   - Includes interactive slice selection and details link

2. **CategoryAnalysisChart** (`src/components/Categories/CategoryAnalysisChart.jsx`)
   - Used in Categories Page
   - Shows income/expense analysis by category
   - Includes date navigation and category type filtering

## Styling

The component uses CSS modules (`BasePieChart.module.css`) with the following key features:

- **Card Design**: Modern gradient background with rounded corners and shadow
- **Responsive Layout**: Flexbox-based layout that adapts to container size
- **Details Link**: Styled as a button positioned at bottom-right of the card
- **Loading States**: Spinner animation and error state styling
- **Hover Effects**: Smooth transitions and interactive feedback

## File Structure

```
src/components/Common/
├── BasePieChart.jsx              # Main component
├── BasePieChart.module.css       # Styling
└── BasePieChartDemo.jsx          # Demo/test component
```

## Demo

To test the BasePieChart component in isolation, you can import and use the `BasePieChartDemo` component which includes sample data and demonstrates all major features.

## Migration from Old Components

When migrating existing pie chart implementations to use BasePieChart:

1. Replace direct Recharts imports with BasePieChart import
2. Move chart configuration to props
3. Replace custom loading/error handling with BasePieChart's built-in states
4. Update CSS imports to use BasePieChart's styling
5. Remove redundant chart rendering logic

## Best Practices

1. **Data Format**: Ensure data objects include required properties (id, name, value)
2. **Color Consistency**: Use consistent color schemes across different charts
3. **Accessibility**: Provide meaningful titles and tooltips
4. **Performance**: Use React.memo if the chart re-renders frequently
5. **Error Handling**: Always provide error states for better UX

## Browser Support

Compatible with all modern browsers that support:
- CSS Grid and Flexbox
- ES6+ JavaScript features
- SVG rendering (for Recharts)
