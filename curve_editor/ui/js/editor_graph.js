const curve = d3.curveCatmullRom.alpha(0.5);
let width = document.documentElement.clientWidth;
let height = document.documentElement.clientHeight;


class ImageObject {
    #image;
    #d3Image;
    constructor() {
        this.#image = new Image();
        this.#d3Image = this.#d3Image = g.append('svg:image')
                .attr('opacity', config.backgroundImageOpacity);
        this.#image.onload = () => {
            this.resize(width, height);
        };
    }

    load(src) {
        this.#d3Image.attr('xlink:href', src);
        this.#image.src = src;
    }

    resize(w, h) {
        if (this.#d3Image) {
            const imageWidth = this.#image.width;
            const imageHeight = this.#image.height;
            const imageAspectRatio = imageWidth / imageHeight;
            const aspectRatio = w / h;
            if (aspectRatio < imageAspectRatio) {
                const scale = h / imageHeight;
                this.#d3Image
                    .attr('width', null)
                    .attr('height', h)
                    .attr('x', (w - imageWidth * scale) / 2)
                    .attr('y', 0);
            } else {
                const scale = w / imageWidth;
                this.#d3Image
                    .attr('width', w)
                    .attr('height', null)
                    .attr('x', 0)
                    .attr('y', (h - imageHeight * scale) / 2);
            }
        }
    }
}

// D3.js用のデータを生成
const createCurvePathData = (startGraphX, endGraphX) => {
    const n = config.curveResolution;
    let data = []
    const yArray = graphEditor.getCurveValueArray(config.editMode, startGraphX, 0, endGraphX, 1, n);
    for (let i = 0; i < n; i++) {
        const x = startGraphX + (endGraphX - startGraphX) / (n - 1) * i;
        data.push({
            x: x,
            y: yArray[i]
        });
    }
    return data;
}

// 描画するカーブの内容を更新
const updateCurvePath = (t = null) => {
    const startGraphX = Math.max(0, currentScaleX.invert(0));
    const endGraphX = Math.min(1, currentScaleX.invert(width));

    path.datum(createCurvePathData(startGraphX, endGraphX));
    (t ? path.transition(t) : path).attr('d', d3.line()
        .x(d => originalScaleX(d.x))
        .y(d => originalScaleY(d.y))
        .curve(curve));

    const editMode = config.editMode;
    if (editMode == 2 || editMode == 3 || editMode == 4) {
        window.top.postMessage({
           to: 'panel-editor',
           command: 'updateParam'
        });
}
}

const updateHandles = () => {
    handles.remove();
    handles = createHandles(getCurrentCurve(), g, currentScaleX, currentScaleY);
}

const updateHandleVisibility = () => {
    $('.anchor, .handle, .handle-line').css('visibility', config.showHandle ? 'visible' : 'hidden');
}

window.addEventListener('message', function(event) {
    switch (event.data.command) {
        case 'changeId':
        updateCurvePath();
        fit(0);
        updateHandles();
            break;

        case 'updateCurvePath':
            updateCurvePath();
            break;

        case 'updateHandles':
            updateHandles();
            break;

        case 'updateHandlePos':
            if (handles instanceof NormalHandles && handles.segmentHandlesArray.length > 1) {
                updateHandles();
                updateCurvePath();
    }
            else {
                const duration = config.enableAnimation ? 180 : 0;
                const t = d3.transition().duration(duration).ease(d3.easeCubicOut);
                handles.updateHandles(t);
                updateCurvePath(t);
    }
            break;

        case 'updateAxisLabelVisibility':
            gLabelX.style('visibility', config.showXLabel ? 'visible' : 'hidden');
            gLabelY.style('visibility', config.showYLabel ? 'visible' : 'hidden');
            break;

        case 'updateHandleVisibility':
            updateHandleVisibility();
            break;

        case 'applyPreferences':
            image.load(config.setBackgroundImage ? config.backgroundImagePath : '');
            path.attr('stroke', config.curveColor)
                .attr('stroke-width', config.curveThickness);
            updateCurvePath();
            break;
    }
});

const svg = d3.select('#canvas')
    .attr('width', width)
    .attr('height', height)
    .on('mousedown', event => {
        if (event.button === 1) {
            event.preventDefault();
        } else if (event.button === 2) {
            event.preventDefault();
            window.top.postMessage({
                to: 'native',
                command: 'contextmenu-graph'
            }, '*');
        }
    })
    .on('dblclick', event => {
        const x = currentScaleX.invert(event.clientX);
        const y = currentScaleY.invert(event.clientY);
        if (handles instanceof NormalHandles && x >= 0 && x <= 1) {
            handles.curve.addCurve(x, y, currentScaleX(1) - currentScaleX(0));
            updateCurvePath();
            updateHandles();
        }
    })
    .on('contextmenu', event => {
        event.preventDefault();
    })
    .on('wheel', event => {
        event.preventDefault();
    });

const g = svg.append('g');

let image = new ImageObject();
if (config.setBackgroundImage) {
    image.load(config.backgroundImagePath);
}

let graphMarginX = Math.min(50, width * 0.1, height * 0.1);
let innerGraphWidth = width - 2 * graphMarginX;
let innerGraphHeight = Math.min(height - 2 * graphMarginX, innerGraphWidth);
let graphMarginY = (height - innerGraphHeight) / 2;
const nTick = 5;

// Add X axis
let originalScaleX = d3.scaleLinear()
    .domain([-graphMarginX / innerGraphWidth, 1 + graphMarginX / innerGraphWidth])
    .range([-2, width + 2]);
const axisX = d3.axisBottom(originalScaleX)
    .ticks(width / height * nTick)
    .tickSize(-height)
    .tickFormat('');
const gridX = g.append('g')
    .attr('class', 'grid')
    .attr('transform', 'translate(0,' + height + ')')
    .call(axisX);

// Add Y axis
let originalScaleY = d3.scaleLinear()
    .domain([-graphMarginY / innerGraphHeight, 1 + graphMarginY / innerGraphHeight])
    .range([height + 2, -2]);
const axisY = d3.axisLeft(originalScaleY)
    .ticks(nTick)
    .tickSize(-width)
    .tickFormat('');
const gridY = g.append('g')
    .attr('class', 'grid')
    .call(axisY);

const subAxisX = d3.axisBottom(originalScaleX)
    .ticks(width / height * nTick * 2)
    .tickSize(-height)
    .tickFormat('');
const subGridX = g.append('g')
    .attr('class', 'grid-sub')
    .attr('transform', 'translate(0,' + height + ')')
    .call(subAxisX);

const subAxisY = d3.axisLeft(originalScaleY)
    .ticks(nTick * 2)
    .tickSize(-width)
    .tickFormat('');
const subGridY = g.append('g')
    .attr('class', 'grid-sub')
    .call(subAxisY);

const zoomContainer = g.append('g');

let currentScaleX = originalScaleX;
let currentScaleY = originalScaleY;

const line = d3.line()
    .x(d => originalScaleX(d.x))
    .y(d => originalScaleY(d.y))
    .curve(curve);

// カーブ
const path = zoomContainer.append('path')
    .datum(createCurvePathData(0, 1))
    .attr('fill', 'none')
    .attr('stroke', config.curveColor)
    .attr('stroke-width', config.curveThickness)
    .attr('d', line);

// 範囲外領域描画用の矩形(左)
const leftRect = g.append('rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', originalScaleX(0))
    .attr('height', height)
    .attr('class', 'rect');

// 範囲外領域描画用の矩形(右)
const rightRect = g.append('rect')
    .attr('x', originalScaleX(1))
    .attr('y', 0)
    .attr('width', width - originalScaleX(1))
    .attr('height', height)
    .attr('class', 'rect');

let handles = createHandles(getCurrentCurve(), g, currentScaleX, currentScaleY);

// 軸ラベル(Y軸)
const axisLabelY = scale => d3.axisLeft(scale).tickPadding(-15).tickFormat(d3.format(''));
const gLabelY = g.append('g')
    .attr('class', 'axis-label-y')
    .call(axisLabelY(originalScaleY));

// Zoom function
const zoom = d3.zoom()
    .scaleExtent([0.0001, 10000])
    .translateExtent([[-width, -Infinity], [2 * width, Infinity]])
    .on('zoom', event => {
        if (event.transform.k == 1 && event.transform.x == 0 && event.transform.y == 0) {
            if ($('#fit').hasClass('visible')) {
                $('#fit').removeClass('visible');
                $('#fit').addClass('hidden');
            }
        }
        else {
            if ($('#fit').hasClass('hidden')) {
                $('#fit').addClass('visible');
                $('#fit').removeClass('hidden');
            }
        }

        currentScaleX = event.transform.rescaleX(originalScaleX);
        currentScaleY = event.transform.rescaleY(originalScaleY);

        const duration = config.enableAnimation ? 180 : 0;
        const t = d3.transition().duration(duration).ease(d3.easeCubicOut);

        const startGraphX = Math.max(0, currentScaleX.invert(-200));
        const endGraphX = Math.min(1, currentScaleX.invert(width + 200));

        path.datum(createCurvePathData(startGraphX, endGraphX));
        path.attr('d', d3.line()
            .x(d => originalScaleX(d.x))
            .y(d => originalScaleY(d.y))
            .curve(curve));

        if (event.sourceEvent && event.sourceEvent.type === 'wheel') {
            gridX.transition(t).call(axisX.scale(currentScaleX));
            gridY.transition(t).call(axisY.scale(currentScaleY));
            subGridX.transition(t).call(subAxisX.scale(currentScaleX));
            subGridY.transition(t).call(subAxisY.scale(currentScaleY));
            gLabelY.transition(t).call(axisLabelY(currentScaleY));
            zoomContainer.transition(t)
                .attr('transform', event.transform);
            path.transition(t)
                .attr('stroke-width', config.curveThickness / event.transform.k);
            leftRect.transition(t)
                .attr('width', Math.max(0, currentScaleX(0)));
            rightRect.transition(t)
                .attr('x', currentScaleX(1))
                .attr('width', Math.max(0, width - currentScaleX(1)));
            handles.rescaleX(currentScaleX, t);
            handles.rescaleY(currentScaleY, t);
        } else {
            gridX.call(axisX.scale(currentScaleX));
            gridY.call(axisY.scale(currentScaleY));
            subGridX.call(subAxisX.scale(currentScaleX));
            subGridY.call(subAxisY.scale(currentScaleY));
            gLabelY.call(axisLabelY(currentScaleY));
            zoomContainer.attr('transform', event.transform);
            leftRect.attr('width', Math.max(0, currentScaleX(0)));
            rightRect.attr('x', currentScaleX(1))
                .attr('width', Math.max(0, width - currentScaleX(1)));
            handles.rescaleX(currentScaleX);
            handles.rescaleY(currentScaleY);
        }
    })
    .on('start', event => {
        if (event.sourceEvent && event.sourceEvent.type !== 'wheel') {
            svg.attr('cursor', 'move');
        }
    })
    .on('end', () => {
        svg.attr('cursor', 'default');
    })
    .filter(event => {
        // ホイールクリックまたはAlt+左クリックの場合のみパンを有効にする
        return event.type == 'wheel'
        || event.button === 1
        || (event.button === 0 && event.altKey);
    });

svg.call(zoom);

// フィット関数
const fit = (customDuration = 700) => {
    const duration = config.enableAnimation ? customDuration : 0;
    const t = d3.transition().duration(duration);
    svg.transition(t)
        .call(zoom.transform, d3.zoomIdentity);
    path.transition(t)
        .attr('stroke-width', config.curveThickness);
}

// フィットボタン
$('#fit').on('click', () => { fit();});

$(window).on('keydown', event => {
    switch (event.key) {
    case 'Home':
        fit();
        break;

    case 'R':
        // window.top.postMessage({
        //     command: 'grapheditor-reverse'
        // }, '*');
        break;
    }    
});

$(window).on('resize', () => {
    width = document.documentElement.clientWidth;
    height = document.documentElement.clientHeight;

    graphMarginX = Math.min(50, width * 0.1, height * 0.1);
    innerGraphWidth = width - 2 * graphMarginX;
    innerGraphHeight = Math.min(height - 2 * graphMarginX, innerGraphWidth);
    graphMarginY = (height - innerGraphHeight) / 2;

    svg.attr('width', width)
        .attr('height', height);

    originalScaleX
        .domain([-graphMarginX / innerGraphWidth, 1 + graphMarginX / innerGraphWidth])
        .range([-2, width + 2]);
    originalScaleY
        .domain([-graphMarginY / innerGraphHeight, 1 + graphMarginY / innerGraphHeight])
        .range([height + 2, -2]);

    const transform = d3.zoomTransform(svg.node());

    currentScaleX = transform.rescaleX(originalScaleX);
    currentScaleY = transform.rescaleY(originalScaleY);

    gridX.call(axisX.tickSize(-height).scale(currentScaleX)).attr('transform', 'translate(0,' + height + ')');
    gridY.call(axisY.tickSize(-width).scale(currentScaleY));
    subGridX.call(subAxisX.tickSize(-height).scale(currentScaleX)).attr('transform', 'translate(0,' + height + ')');
    subGridY.call(subAxisY.tickSize(-width).scale(currentScaleY));
    gLabelY.call(axisLabelY(currentScaleY));
    leftRect.attr('width', currentScaleX(0))
        .attr('height', height);
    rightRect.attr('x', currentScaleX(1))
        .attr('width', width - currentScaleX(1))
        .attr('height', height);
    handles.rescaleX(currentScaleX);
    handles.rescaleY(currentScaleY);
    path.attr('d', d3.line()
        .x(d => originalScaleX(d.x))
        .y(d => originalScaleY(d.y))
        .curve(curve));
    image.resize(width, height);
});