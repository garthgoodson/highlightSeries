/*
  Flot plugin for highlighting series.

  highlightSeries: {
  autoHighlight: true (default) or false
  , color: color
  }

  If "autoHighlight" is true (the default) and the plot's "hoverable" setting is true
  series are highlighted when the mouse hovers near an item.
  "color" is the color of the highlighted series (default is "red").

  The plugin also adds two public methods that allow you to highlight and
  unhighlight a series manually by specifying a series by label, index or object.

  - highlightSeries(series, [color])

  - unHighlightSeries(series)
*/
var count = 1;
(function ($) {
    var log = (function () {
	var out = $("#out");
	return function () {
	    if (!arguments) { return; }
	    var msg = Array.prototype.slice.call(arguments).join(" ");
	    if (!out.length) {
		out = $("#out");
	    }
	    if (out.length) {
		out.text(msg);
	    }
	};
    })();

    var options = {
	highlightSeries: {
	    autoHighlight: true
	    , color: "blue"
            , highlightCallback: null
            , unHighlightCallback: null
            , scale: 0.75
	}
    };

    function init(plot) {
	var highlightedSeries = {};
	var originalColors = {};
        var originalSeriesSettings = {};
        var hiddenSeries = {};
	var lastHighlighted = null;

	function highlightSeries(series) {
	    var seriesAndIndex = getSeriesAndIndex(series)
	    var options = plot.getOptions().highlightSeries;

	    series = seriesAndIndex[1];

	    highlightedSeries[seriesAndIndex[0]] = series;
	    originalColors[seriesAndIndex[0]] = series.color;

	    series.color =
                $.color.parse(series.color).scale('rgb',options.scale).toString();

            lastHighlighted = series;

	    plot.triggerRedrawOverlay();
	};
	plot.highlightSeries = highlightSeries;

	function unHighlightSeries(series) {
            if (lastHighlighted == null) {
                return;
            }

	    var seriesAndIndex = getSeriesAndIndex(series)
            if (typeof originalColors[seriesAndIndex[0]] === 'undefined') {
                return;
            }

	    seriesAndIndex[1].color = originalColors[seriesAndIndex[0]];

	    delete highlightedSeries[seriesAndIndex[0]];
	    plot.triggerRedrawOverlay();
	};
	plot.unHighlightSeries = unHighlightSeries;

	plot.hooks.bindEvents.push(function (plot, eventHolder) {
	    if (!plot.getOptions().highlightSeries.autoHighlight) {
		return;
	    }

	    plot.getPlaceholder().bind("plothover", plotHover);
	});

        function plotHover(evt, pos, item) {

	    if (item && lastHighlighted !== item.series) {

		for (var seriesIndex in highlightedSeries) {
		    delete highlightedSeries[seriesIndex];
		}

		if (lastHighlighted) {
		    unHighlightSeries(lastHighlighted);
                    var cb = plot.getOptions().highlightSeries.unHighlightCallback;
                    if (typeof (cb) === 'function') {
			cb (lastHighlighted.label);
                    }
		}

		lastHighlighted = item.series;
		highlightSeries(item.series);
                var cb = plot.getOptions().highlightSeries.highlightCallback;
                if (typeof (cb) === 'function') {
                    cb (item.series.label);
                }
	    }
	    else if (!item && lastHighlighted) {
		unHighlightSeries(lastHighlighted);
                var cb = plot.getOptions().highlightSeries.unHighlightCallback;
                if (typeof (cb) === 'function') {
                    cb (lastHighlighted.label);
                }
		lastHighlighted = null;
	    }
	}

	function getSeriesAndIndex(series) {
	    var allPlotSeries = plot.getData();

	    if (typeof series == "number") {
		return [series, allPlotSeries[series]];
	    }
	    else {
		for (var ii = 0; ii < allPlotSeries.length; ii++) {
		    var plotSeries = allPlotSeries[ii];

		    if (
			plotSeries === series
			    || plotSeries.label === series
			    || plotSeries.label === series.label
		    ) {
			return [ii, plotSeries];
		    }
		}
	    }
	}

	plot.hooks.drawOverlay.push(function (plot, ctx) {
            if (lastHighlighted == null) {
                return;
            }
	    for(var seriesIndex in highlightedSeries) {
		plot.drawSeries(highlightedSeries[seriesIndex], ctx);
	    }
	});

        plot.hooks.shutdown.push(function (plot, eventHolder) {
	    plot.getPlaceholder().unbind("plothover", plotHover);
        });

    }

    $.plot.plugins.push({
	init: init,
	options: options,
	name: "highlightSeries",
	version: "1.0"
    });
})(jQuery);
