  /**
   * Highcharts X-range series plugin
   * Updated/Modified by: Dustin Hardin 
   * Email: dhardin07@gmail.com
   */
  (function(H) {
      var defaultPlotOptions = H.getOptions().plotOptions,
          columnType = H.seriesTypes.column,
          each = H.each,
          extendClass = H.extendClass,
          pick = H.pick,
          Point = H.Point;

      defaultPlotOptions.xrange = H.merge(defaultPlotOptions.column, {});
      H.seriesTypes.xrange = H.extendClass(columnType, {
          pointClass: extendClass(Point, {
              // Add x2 and yCategory to the available properties for tooltip formats
              getLabelConfig: function() {
                  var cfg = Point.prototype.getLabelConfig.call(this);

                  cfg.x2 = this.x2;
                  cfg.yCategory = this.yCategory = this.series.yAxis.categories && this.series.yAxis.categories[this.y];
                  return cfg;
              }
          }),
          type: 'xrange',
          forceDL: true,
          parallelArrays: ['x', 'x2', 'y'],
          requireSorting: false,
          animate: H.seriesTypes.line.prototype.animate,
          /**
           * Borrow the column series metrics, but with swapped axes. This gives free access
           * to features like groupPadding, grouping, pointWidth etc.
           */
          getColumnMetrics: function() {
              var metrics,
                  chart = this.chart;

              function swapAxes() {
                  each(chart.series, function(s) {
                      var xAxis = s.xAxis;
                      s.xAxis = s.yAxis;
                      s.yAxis = xAxis;
                  });
              }

              swapAxes();

              this.yAxis.closestPointRange = 1;
              metrics = columnType.prototype.getColumnMetrics.call(this);

              swapAxes();

              return metrics;
          },

          translate: function() {
              columnType.prototype.translate.apply(this, arguments);
              var series = this,
                  xAxis = series.xAxis,
                  yAxis = series.yAxis,
                   metrics = series.columnMetrics,
                   toolTipXMin = 0,
                   toolTipXMax = 0,
                   chartWidth = series.xAxis.width;

              H.each(series.points, function(point) {
                  barWidth = xAxis.translate(H.pick(point.x2, point.x + (point.len || 0))) - point.plotX;
                  point.shapeArgs = {
                      x: point.plotX,
                      y: point.plotY + metrics.offset,
                      width: barWidth,
                      height: metrics.width
                  };
                  toolTipXMin = Math.max(0, point.plotX);
                  toolTipXMax = Math.min(point.plotX + barWidth, chartWidth);
                  //set x position of pointer to middle of visible bar portion. 
                  //0 is left of chart. plotX is left display value
                 // point.tooltipPos[0] += barWidth / 2;
                  point.tooltipPos[0] = (toolTipXMin + toolTipXMax) / 2;
                  point.tooltipPos[1] -= metrics.width / 2;
              });
          }
      });

      /**
       * Max x2 should be considered in xAxis extremes
       */
      H.wrap(H.Axis.prototype, 'getSeriesExtremes', function(proceed) {
          var axis = this,
              dataMax,
              modMax;

          proceed.call(this);
          if (this.isXAxis) {
              dataMax = pick(axis.dataMax, Number.MIN_VALUE);
              each(this.series, function(series) {
                  each(series.x2Data || [], function(val) {
                      if (val > dataMax) {
                          dataMax = val;
                          modMax = true;
                      }
                  });
              });
              if (modMax) {
                  axis.dataMax = dataMax;
              }
          }
      });
  }(Highcharts));
