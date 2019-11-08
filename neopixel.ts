/**
 * Well known colors for a NeoPixel strip
 */
enum NeoPixelColors {
    //% block=red
    Red = 0xFF0000,
    //% block=orange
    Orange = 0xFFA500,
    //% block=yellow
    Yellow = 0xFFFF00,
    //% block=green
    Green = 0x00FF00,
    //% block=blue
    Blue = 0x0000FF,
    //% block=indigo
    Indigo = 0x4b0082,
    //% block=violet
    Violet = 0x8a2be2,
    //% block=purple
    Purple = 0xFF00FF,
    //% block=white
    White = 0xFFFFFF,
    //% block=black
    Black = 0x000000
}

/**
 * Different modes for RGB or RGB+W NeoPixel strips
 */
enum NeoPixelMode {
    //% block="RGB (GRB format)"
    RGB = 0,
    //% block="RGB+W"
    RGBW = 1,
    //% block="RGB (RGB format)"
    RGB_RGB = 2
}

/**
 * Functions to operate NeoPixel strips.
 */
//% weight=5 color=#2699BF icon="\uf110"
namespace neopixel {
    /**
     * A NeoPixel strip
     */
    export class Strip {
        buf: Buffer;
        pin: DigitalPin;
        // TODO: encode as bytes instead of 32bit
        brightness: number;
        start: number; // start offset in LED strip
        _length: number; // number of LEDs
        _mode: NeoPixelMode;
        _matrixWidth: number; // number of leds in a matrix - if any

        /**
         * Shows all LEDs to a given color (range 0-255 for r, g, b). 
         * @param rgb RGB color of the LED
         */
        //% blockId="neopixel_set_strip_color" block="%strip|show color %rgb=neopixel_colors" 
        //% weight=85 blockGap=8
        //% parts="neopixel"
        showColor(rgb: number) {
            rgb = rgb >> 0;
            this.setAllRGB(rgb);
            this.show();
        }

        /**
         * Shows a rainbow pattern on all LEDs. 
         * @param startHue the start hue value for the rainbow, eg: 1
         * @param endHue the end hue value for the rainbow, eg: 360
         */
        //% blockId="neopixel_set_strip_rainbow" block="%strip|show rainbow from %startHue|to %endHue" 
        //% weight=85 blockGap=8
        //% parts="neopixel"
        showRainbow(startHue: number = 1, endHue: number = 360) {
            if (this._length <= 0) return;

            startHue = startHue >> 0;
            endHue = endHue >> 0;
            const saturation = 100;
            const luminance = 50;
            const steps = this._length;
            const direction = HueInterpolationDirection.Clockwise;

            //hue
            const h1 = startHue;
            const h2 = endHue;
            const hDistCW = ((h2 + 360) - h1) % 360;
            const hStepCW = Math.idiv((hDistCW * 100), steps);
            const hDistCCW = ((h1 + 360) - h2) % 360;
            const hStepCCW = Math.idiv(-(hDistCCW * 100), steps);
            let hStep: number;
            if (direction === HueInterpolationDirection.Clockwise) {
                hStep = hStepCW;
            } else if (direction === HueInterpolationDirection.CounterClockwise) {
                hStep = hStepCCW;
            } else {
                hStep = hDistCW < hDistCCW ? hStepCW : hStepCCW;
            }
            const h1_100 = h1 * 100; //we multiply by 100 so we keep more accurate results while doing interpolation

            //sat
            const s1 = saturation;
            const s2 = saturation;
            const sDist = s2 - s1;
            const sStep = Math.idiv(sDist, steps);
            const s1_100 = s1 * 100;

            //lum
            const l1 = luminance;
            const l2 = luminance;
            const lDist = l2 - l1;
            const lStep = Math.idiv(lDist, steps);
            const l1_100 = l1 * 100

            //interpolate
            if (steps === 1) {
                this.setPixelColor(0, hsl(h1 + hStep, s1 + sStep, l1 + lStep))
            } else {
                this.setPixelColor(0, hsl(startHue, saturation, luminance));
                for (let i = 1; i < steps - 1; i++) {
                    const h = Math.idiv((h1_100 + i * hStep), 100) + 360;
                    const s = Math.idiv((s1_100 + i * sStep), 100);
                    const l = Math.idiv((l1_100 + i * lStep), 100);
                    this.setPixelColor(i, hsl(h, s, l));
                }
                this.setPixelColor(steps - 1, hsl(endHue, saturation, luminance));
            }
            this.show();
        }

        /**
         * Displays a vertical bar graph based on the `value` and `high` value.
         * If `high` is 0, the chart gets adjusted automatically.
         * @param value current value to plot
         * @param high maximum value, eg: 255
         */
        //% weight=84
        //% blockId=neopixel_show_bar_graph block="%strip|show bar graph of %value|up to %high" 
        //% icon="\uf080"
        //% parts="neopixel"
        showBarGraph(value: number, high: number): void {
            if (high <= 0) {
                this.clear();
                this.setPixelColor(0, NeoPixelColors.Yellow);
                this.show();
                return;
            }

            value = Math.abs(value);
            const n = this._length;
            const n1 = n - 1;
            let v = Math.idiv((value * n), high);
            if (v == 0) {
                this.setPixelColor(0, 0x666600);
                for (let i = 1; i < n; ++i)
                    this.setPixelColor(i, 0);
            } else {
                for (let i = 0; i < n; ++i) {
                    if (i <= v) {
                        const b = Math.idiv(i * 255, n1);
                        this.setPixelColor(i, neopixel.rgb(b, 0, 255 - b));
                    }
                    else this.setPixelColor(i, 0);
                }
            }
            this.show();
        }

        /**
         * Set LED to a given color (range 0-255 for r, g, b). 
         * You need to call ``show`` to make the changes visible.
         * @param pixeloffset position of the NeoPixel in the strip
         * @param rgb RGB color of the LED
         */
        //% blockId="neopixel_set_pixel_color" block="%strip|set pixel color at %pixeloffset|to %rgb=neopixel_colors" 
        //% blockGap=8
        //% weight=80
        //% parts="neopixel" advanced=true
        setPixelColor(pixeloffset: number, rgb: number): void {
            this.setPixelRGB(pixeloffset >> 0, rgb >> 0);
        }

        /**
         * Sets the number of pixels in a matrix shaped strip
         * @param width number of pixels in a row
         */
        //% blockId=neopixel_set_matrix_width block="%strip|set matrix width %width"
        //% blockGap=8
        //% weight=5
        //% parts="neopixel" advanced=true
        setMatrixWidth(width: number) {
            this._matrixWidth = Math.min(this._length, width >> 0);
        }

        /**
         * Set LED to a given color (range 0-255 for r, g, b) in a matrix shaped strip 
         * You need to call ``show`` to make the changes visible.
         * @param x horizontal position
         * @param y horizontal position
         * @param rgb RGB color of the LED
         */
        //% blockId="neopixel_set_matrix_color" block="%strip|set matrix color at x %x|y %y|to %rgb=neopixel_colors" 
        //% weight=4
        //% parts="neopixel" advanced=true
        setMatrixColor(x: number, y: number, rgb: number) {
            if (this._matrixWidth <= 0) return; // not a matrix, ignore
            x = x >> 0;
            y = y >> 0;
            rgb = rgb >> 0;
            const cols = Math.idiv(this._length, this._matrixWidth);
            if (x < 0 || x >= this._matrixWidth || y < 0 || y >= cols) return;
            let i = x + y * this._matrixWidth;
            this.setPixelColor(i, rgb);
        }
        
        /**
         * For NeoPixels with RGB+W LEDs, set the white LED brightness. This only works for RGB+W NeoPixels.
         * @param pixeloffset position of the LED in the strip
         * @param white brightness of the white LED
         */
        //% blockId="neopixel_set_pixel_white" block="%strip|set pixel white LED at %pixeloffset|to %white" 
        //% blockGap=8
        //% weight=80
        //% parts="neopixel" advanced=true
        setPixelWhiteLED(pixeloffset: number, white: number): void {            
            if (this._mode === NeoPixelMode.RGBW) {
                this.setPixelW(pixeloffset >> 0, white >> 0);
            }
        }

        //% blockId=neopixel_color_picker
        //% block="%strip row nr.$nr | $x01|$x02|$x03|$x04|$x05|$x06|$x07|$x08|$x09|$x10|$x11|$x12|$x13|$x14|$x15|$x16"
        //% x01.shadow="colorNumberPicker"
        //% x02.shadow="colorNumberPicker"
        //% x03.shadow="colorNumberPicker"
        //% x04.shadow="colorNumberPicker"
        //% x05.shadow="colorNumberPicker"
        //% x06.shadow="colorNumberPicker"
        //% x07.shadow="colorNumberPicker"
        //% x08.shadow="colorNumberPicker"
        //% x09.shadow="colorNumberPicker"
        //% x10.shadow="colorNumberPicker"
        //% x11.shadow="colorNumberPicker"
        //% x12.shadow="colorNumberPicker"
        //% x13.shadow="colorNumberPicker"
        //% x14.shadow="colorNumberPicker"
        //% x15.shadow="colorNumberPicker"
        //% x16.shadow="colorNumberPicker"
        //% inlineInputMode=inline
        //% parts="neopixel" advanced=true
        colorPicker(nr:number, x01:number, x02:number, x03:number, x04:number, x05:number, x06:number, x07:number, x08:number, x09:number, x10:number, x11:number, x12:number, x13:number, x14:number, x15:number, x16:number) {
            let y = nr;
            let x = [x01, x02, x03, x04, x05, x06, x07, x08, x09, x10, x11, x12, x13, x14, x15, x16];
            if (y == 0) {
                this.setPixelColor(0, x01);
                this.setPixelColor(1, x02);
                this.setPixelColor(2, x03);
                this.setPixelColor(3, x04);
                this.setPixelColor(4, x05);
                this.setPixelColor(5, x06);
                this.setPixelColor(6, x07);
                this.setPixelColor(7, x08);
                this.setPixelColor(8, x09);
                this.setPixelColor(9, x10);
                this.setPixelColor(10, x11);
                this.setPixelColor(11, x12);
                this.setPixelColor(12, x13);
                this.setPixelColor(13, x14);
                this.setPixelColor(14, x15);
                this.setPixelColor(15, x16);
            } else if (y == 1) {
                this.setPixelColor(16, x01);
                this.setPixelColor(17, x02);
                this.setPixelColor(18, x03);
                this.setPixelColor(19, x04);
                this.setPixelColor(20, x05);
                this.setPixelColor(21, x06);
                this.setPixelColor(22, x07);
                this.setPixelColor(23, x08);
                this.setPixelColor(24, x09);
                this.setPixelColor(25, x10);
                this.setPixelColor(26, x11);
                this.setPixelColor(27, x12);
                this.setPixelColor(28, x13);
                this.setPixelColor(29, x14);
                this.setPixelColor(30, x15);
                this.setPixelColor(31, x16);
            } else if (y == 2) { 
                this.setPixelColor(32, x01);
                this.setPixelColor(33, x02);
                this.setPixelColor(34, x03);
                this.setPixelColor(35, x04);
                this.setPixelColor(36, x05);
                this.setPixelColor(37, x06);
                this.setPixelColor(38, x07);
                this.setPixelColor(39, x08);
                this.setPixelColor(40, x09);
                this.setPixelColor(41, x10);
                this.setPixelColor(42, x11);
                this.setPixelColor(43, x12);
                this.setPixelColor(44, x13);
                this.setPixelColor(45, x14);
                this.setPixelColor(46, x15);
                this.setPixelColor(47, x16);
            } else if (y == 3) { 
                this.setPixelColor(48, x01);
                this.setPixelColor(49, x02);
                this.setPixelColor(50, x03);
                this.setPixelColor(51, x04);
                this.setPixelColor(52, x05);
                this.setPixelColor(53, x06);
                this.setPixelColor(54, x07);
                this.setPixelColor(55, x08);
                this.setPixelColor(56, x09);
                this.setPixelColor(57, x10);
                this.setPixelColor(58, x11);
                this.setPixelColor(59, x12);
                this.setPixelColor(60, x13);
                this.setPixelColor(61, x14);
                this.setPixelColor(62, x15);
                this.setPixelColor(63, x16);
            } else if (y == 4) { 
                this.setPixelColor(64, x01);
                this.setPixelColor(65, x02);
                this.setPixelColor(66, x03);
                this.setPixelColor(67, x04);
                this.setPixelColor(68, x05);
                this.setPixelColor(69, x06);
                this.setPixelColor(70, x07);
                this.setPixelColor(71, x08);
                this.setPixelColor(72, x09);
                this.setPixelColor(73, x10);
                this.setPixelColor(74, x11);
                this.setPixelColor(75, x12);
                this.setPixelColor(76, x13);
                this.setPixelColor(77, x14);
                this.setPixelColor(78, x15);
                this.setPixelColor(79, x16);
            } else if (y == 5) { 
                this.setPixelColor(80, x01);
                this.setPixelColor(81, x02);
                this.setPixelColor(82, x03);
                this.setPixelColor(83, x04);
                this.setPixelColor(84, x05);
                this.setPixelColor(85, x06);
                this.setPixelColor(86, x07);
                this.setPixelColor(87, x08);
                this.setPixelColor(88, x09);
                this.setPixelColor(89, x10);
                this.setPixelColor(90, x11);
                this.setPixelColor(91, x12);
                this.setPixelColor(92, x13);
                this.setPixelColor(93, x14);
                this.setPixelColor(94, x15);
                this.setPixelColor(95, x16);
            } else if (y == 6) { 
                this.setPixelColor(96, x01);
                this.setPixelColor(97, x02);
                this.setPixelColor(98, x03);
                this.setPixelColor(99, x04);
                this.setPixelColor(100, x05);
                this.setPixelColor(101, x06);
                this.setPixelColor(102, x07);
                this.setPixelColor(103, x08);
                this.setPixelColor(104, x09);
                this.setPixelColor(105, x10);
                this.setPixelColor(106, x11);
                this.setPixelColor(107, x12);
                this.setPixelColor(108, x13);
                this.setPixelColor(109, x14);
                this.setPixelColor(110, x15);
                this.setPixelColor(111, x16);
            } else if (y == 7) { 
                this.setPixelColor(112, x01);
                this.setPixelColor(113, x02);
                this.setPixelColor(114, x03);
                this.setPixelColor(115, x04);
                this.setPixelColor(116, x05);
                this.setPixelColor(117, x06);
                this.setPixelColor(118, x07);
                this.setPixelColor(119, x08);
                this.setPixelColor(120, x09);
                this.setPixelColor(121, x10);
                this.setPixelColor(122, x11);
                this.setPixelColor(123, x12);
                this.setPixelColor(124, x13);
                this.setPixelColor(125, x14);
                this.setPixelColor(126, x15);
                this.setPixelColor(127, x16);
            } else if (y == 8) { 
                this.setPixelColor(128, x01);
                this.setPixelColor(129, x02);
                this.setPixelColor(130, x03);
                this.setPixelColor(131, x04);
                this.setPixelColor(132, x05);
                this.setPixelColor(133, x06);
                this.setPixelColor(134, x07);
                this.setPixelColor(135, x08);
                this.setPixelColor(136, x09);
                this.setPixelColor(137, x10);
                this.setPixelColor(138, x11);
                this.setPixelColor(139, x12);
                this.setPixelColor(140, x13);
                this.setPixelColor(141, x14);
                this.setPixelColor(142, x15);
                this.setPixelColor(143, x16);
            } else if (y == 9) { 
                this.setPixelColor(144, x01);
                this.setPixelColor(145, x02);
                this.setPixelColor(146, x03);
                this.setPixelColor(147, x04);
                this.setPixelColor(148, x05);
                this.setPixelColor(149, x06);
                this.setPixelColor(150, x07);
                this.setPixelColor(151, x08);
                this.setPixelColor(152, x09);
                this.setPixelColor(153, x10);
                this.setPixelColor(154, x11);
                this.setPixelColor(155, x12);
                this.setPixelColor(156, x13);
                this.setPixelColor(157, x14);
                this.setPixelColor(158, x15);
                this.setPixelColor(159, x16);
            } else if (y == 10) { 
                this.setPixelColor(160, x01);
                this.setPixelColor(161, x02);
                this.setPixelColor(162, x03);
                this.setPixelColor(163, x04);
                this.setPixelColor(164, x05);
                this.setPixelColor(165, x06);
                this.setPixelColor(166, x07);
                this.setPixelColor(167, x08);
                this.setPixelColor(168, x09);
                this.setPixelColor(169, x10);
                this.setPixelColor(170, x11);
                this.setPixelColor(171, x12);
                this.setPixelColor(172, x13);
                this.setPixelColor(173, x14);
                this.setPixelColor(174, x15);
                this.setPixelColor(175, x16);
            } else if (y == 11) { 
                this.setPixelColor(176, x01);
                this.setPixelColor(177, x02);
                this.setPixelColor(178, x03);
                this.setPixelColor(179, x04);
                this.setPixelColor(180, x05);
                this.setPixelColor(181, x06);
                this.setPixelColor(182, x07);
                this.setPixelColor(183, x08);
                this.setPixelColor(184, x09);
                this.setPixelColor(185, x10);
                this.setPixelColor(186, x11);
                this.setPixelColor(187, x12);
                this.setPixelColor(188, x13);
                this.setPixelColor(189, x14);
                this.setPixelColor(190, x15);
                this.setPixelColor(191, x16);
            } else if (y == 12) { 
                this.setPixelColor(192, x01);
                this.setPixelColor(193, x02);
                this.setPixelColor(194, x03);
                this.setPixelColor(195, x04);
                this.setPixelColor(196, x05);
                this.setPixelColor(197, x06);
                this.setPixelColor(198, x07);
                this.setPixelColor(199, x08);
                this.setPixelColor(200, x09);
                this.setPixelColor(201, x10);
                this.setPixelColor(202, x11);
                this.setPixelColor(203, x12);
                this.setPixelColor(204, x13);
                this.setPixelColor(205, x14);
                this.setPixelColor(206, x15);
                this.setPixelColor(207, x16);
            } else if (y == 13) { 
                this.setPixelColor(208, x01);
                this.setPixelColor(209, x02);
                this.setPixelColor(210, x03);
                this.setPixelColor(211, x04);
                this.setPixelColor(212, x05);
                this.setPixelColor(213, x06);
                this.setPixelColor(214, x07);
                this.setPixelColor(215, x08);
                this.setPixelColor(216, x09);
                this.setPixelColor(217, x10);
                this.setPixelColor(218, x11);
                this.setPixelColor(219, x12);
                this.setPixelColor(220, x13);
                this.setPixelColor(221, x14);
                this.setPixelColor(222, x15);
                this.setPixelColor(223, x16);
            } else if (y == 14) { 
                this.setPixelColor(224, x01);
                this.setPixelColor(225, x02);
                this.setPixelColor(226, x03);
                this.setPixelColor(227, x04);
                this.setPixelColor(228, x05);
                this.setPixelColor(229, x06);
                this.setPixelColor(230, x07);
                this.setPixelColor(231, x08);
                this.setPixelColor(232, x09);
                this.setPixelColor(233, x10);
                this.setPixelColor(234, x11);
                this.setPixelColor(235, x12);
                this.setPixelColor(236, x13);
                this.setPixelColor(237, x14);
                this.setPixelColor(238, x15);
                this.setPixelColor(239, x16);
            } else if (y == 15) { 
                this.setPixelColor(240, x01);
                this.setPixelColor(241, x02);
                this.setPixelColor(242, x03);
                this.setPixelColor(243, x04);
                this.setPixelColor(244, x05);
                this.setPixelColor(245, x06);
                this.setPixelColor(246, x07);
                this.setPixelColor(247, x08);
                this.setPixelColor(248, x09);
                this.setPixelColor(249, x10);
                this.setPixelColor(250, x11);
                this.setPixelColor(251, x12);
                this.setPixelColor(252, x13);
                this.setPixelColor(253, x14);
                this.setPixelColor(254, x15);
                this.setPixelColor(255, x16);
            } 
        }

        /** 
         * Send all the changes to the strip.
         */
        //% blockId="neopixel_show" block="%strip|show" blockGap=8
        //% weight=79
        //% parts="neopixel"
        show() {
            ws2812b.sendBuffer(this.buf, this.pin);
        }

        /**
         * Turn off all LEDs.
         * You need to call ``show`` to make the changes visible.
         */
        //% blockId="neopixel_clear" block="%strip|clear"
        //% weight=76
        //% parts="neopixel"
        clear(): void {
            const stride = this._mode === NeoPixelMode.RGBW ? 4 : 3;
            this.buf.fill(0, this.start * stride, this._length * stride);
        }

        /**
         * Gets the number of pixels declared on the strip
         */
        //% blockId="neopixel_length" block="%strip|length" blockGap=8
        //% weight=60 advanced=true
        length() {
            return this._length;
        }

        /**
         * Set the brightness of the strip. This flag only applies to future operation.
         * @param brightness a measure of LED brightness in 0-255. eg: 255
         */
        //% blockId="neopixel_set_brightness" block="%strip|set brightness %brightness" blockGap=8
        //% weight=59
        //% parts="neopixel" advanced=true
        setBrightness(brightness: number): void {
            this.brightness = brightness & 0xff;
        }

        /**
         * Apply brightness to current colors using a quadratic easing function.
         **/
        //% blockId="neopixel_each_brightness" block="%strip|ease brightness" blockGap=8
        //% weight=58
        //% parts="neopixel" advanced=true
        easeBrightness(): void {
            const stride = this._mode === NeoPixelMode.RGBW ? 4 : 3;
            const br = this.brightness;
            const buf = this.buf;
            const end = this.start + this._length;
            const mid = Math.idiv(this._length, 2);
            for (let i = this.start; i < end; ++i) {
                const k = i - this.start;
                const ledoffset = i * stride;
                const br = k > mid
                    ? Math.idiv(255 * (this._length - 1 - k) * (this._length - 1 - k), (mid * mid))
                    : Math.idiv(255 * k * k, (mid * mid));
                const r = (buf[ledoffset + 0] * br) >> 8; buf[ledoffset + 0] = r;
                const g = (buf[ledoffset + 1] * br) >> 8; buf[ledoffset + 1] = g;
                const b = (buf[ledoffset + 2] * br) >> 8; buf[ledoffset + 2] = b;
                if (stride == 4) {
                    const w = (buf[ledoffset + 3] * br) >> 8; buf[ledoffset + 3] = w;
                }
            }
        }

        /** 
         * Create a range of LEDs.
         * @param start offset in the LED strip to start the range
         * @param length number of LEDs in the range. eg: 4
         */
        //% weight=89
        //% blockId="neopixel_range" block="%strip|range from %start|with %length|leds"
        //% parts="neopixel"
        //% blockSetVariable=range
        range(start: number, length: number): Strip {
            start = start >> 0;
            length = length >> 0;
            let strip = new Strip();
            strip.buf = this.buf;
            strip.pin = this.pin;
            strip.brightness = this.brightness;
            strip.start = this.start + Math.clamp(0, this._length - 1, start);
            strip._length = Math.clamp(0, this._length - (strip.start - this.start), length);
            strip._matrixWidth = 0;
            strip._mode = this._mode;
            return strip;
        }

        /**
         * Shift LEDs forward and clear with zeros.
         * You need to call ``show`` to make the changes visible.
         * @param offset number of pixels to shift forward, eg: 1
         */
        //% blockId="neopixel_shift" block="%strip|shift pixels by %offset" blockGap=8
        //% weight=40
        //% parts="neopixel"
        shift(offset: number = 1): void {
            offset = offset >> 0;
            const stride = this._mode === NeoPixelMode.RGBW ? 4 : 3;
            this.buf.shift(-offset * stride, this.start * stride, this._length * stride)
        }

        /**
         * Rotate LEDs forward.
         * You need to call ``show`` to make the changes visible.
         * @param offset number of pixels to rotate forward, eg: 1
         */
        //% blockId="neopixel_rotate" block="%strip|rotate pixels by %offset" blockGap=8
        //% weight=39
        //% parts="neopixel"
        rotate(offset: number = 1): void {
            offset = offset >> 0;
            const stride = this._mode === NeoPixelMode.RGBW ? 4 : 3;
            this.buf.rotate(-offset * stride, this.start * stride, this._length * stride)
        }

        /**
         * Set the pin where the neopixel is connected, defaults to P0.
         */
        //% weight=10
        //% parts="neopixel" advanced=true
        setPin(pin: DigitalPin): void {
            this.pin = pin;
            pins.digitalWritePin(this.pin, 0);
            // don't yield to avoid races on initialization
        }

        /**
         * Estimates the electrical current (mA) consumed by the current light configuration.
         */
        //% weight=9 blockId=neopixel_power block="%strip|power (mA)"
        //% advanced=true
        power(): number {
            const stride = this._mode === NeoPixelMode.RGBW ? 4 : 3;
            const end = this.start + this._length;
            let p = 0;
            for (let i = this.start; i < end; ++i) {
                const ledoffset = i * stride;
                for (let j = 0; j < stride; ++j) {
                    p += this.buf[i + j];
                }
            }
            return Math.idiv(this.length(), 2) /* 0.5mA per neopixel */
                + Math.idiv(p * 433, 10000); /* rought approximation */
        }

        private setBufferRGB(offset: number, red: number, green: number, blue: number): void {
            if (this._mode === NeoPixelMode.RGB_RGB) {
                this.buf[offset + 0] = red;
                this.buf[offset + 1] = green;
            } else {
                this.buf[offset + 0] = green;
                this.buf[offset + 1] = red;
            }
            this.buf[offset + 2] = blue;
        }

        private setAllRGB(rgb: number) {
            let red = unpackR(rgb);
            let green = unpackG(rgb);
            let blue = unpackB(rgb);

            const br = this.brightness;
            if (br < 255) {
                red = (red * br) >> 8;
                green = (green * br) >> 8;
                blue = (blue * br) >> 8;
            }
            const end = this.start + this._length;
            const stride = this._mode === NeoPixelMode.RGBW ? 4 : 3;
            for (let i = this.start; i < end; ++i) {
                this.setBufferRGB(i * stride, red, green, blue)
            }
        }
        private setAllW(white: number) {
            if (this._mode !== NeoPixelMode.RGBW)
                return;

            let br = this.brightness;
            if (br < 255) {
                white = (white * br) >> 8;
            }
            let buf = this.buf;
            let end = this.start + this._length;
            for (let i = this.start; i < end; ++i) {
                let ledoffset = i * 4;
                buf[ledoffset + 3] = white;
            }
        }
        private setPixelRGB(pixeloffset: number, rgb: number): void {
            if (pixeloffset < 0
                || pixeloffset >= this._length)
                return;

            let stride = this._mode === NeoPixelMode.RGBW ? 4 : 3;
            pixeloffset = (pixeloffset + this.start) * stride;

            let red = unpackR(rgb);
            let green = unpackG(rgb);
            let blue = unpackB(rgb);

            let br = this.brightness;
            if (br < 255) {
                red = (red * br) >> 8;
                green = (green * br) >> 8;
                blue = (blue * br) >> 8;
            }
            this.setBufferRGB(pixeloffset, red, green, blue)
        }
        private setPixelW(pixeloffset: number, white: number): void {
            if (this._mode !== NeoPixelMode.RGBW)
                return;

            if (pixeloffset < 0
                || pixeloffset >= this._length)
                return;

            pixeloffset = (pixeloffset + this.start) * 4;

            let br = this.brightness;
            if (br < 255) {
                white = (white * br) >> 8;
            }
            let buf = this.buf;
            buf[pixeloffset + 3] = white;
        }
    }

    /**
     * Create a new NeoPixel driver for `numleds` LEDs.
     * @param pin the pin where the neopixel is connected.
     * @param numleds number of leds in the strip, eg: 24,30,60,64
     */
    //% blockId="neopixel_create" block="NeoPixel at pin %pin|with %numleds|leds as %mode"
    //% weight=90 blockGap=8
    //% parts="neopixel"
    //% trackArgs=0,2
    //% blockSetVariable=strip
    export function create(pin: DigitalPin, numleds: number, mode: NeoPixelMode): Strip {
        let strip = new Strip();
        let stride = mode === NeoPixelMode.RGBW ? 4 : 3;
        strip.buf = pins.createBuffer(numleds * stride);
        strip.start = 0;
        strip._length = numleds;
        strip._mode = mode;
        strip._matrixWidth = 0;
        strip.setBrightness(128)
        strip.setPin(pin)
        return strip;
    }

    /**
     * Converts red, green, blue channels into a RGB color
     * @param red value of the red channel between 0 and 255. eg: 255
     * @param green value of the green channel between 0 and 255. eg: 255
     * @param blue value of the blue channel between 0 and 255. eg: 255
     */
    //% weight=1
    //% blockId="neopixel_rgb" block="red %red|green %green|blue %blue"
    //% advanced=true
    export function rgb(red: number, green: number, blue: number): number {
        return packRGB(red, green, blue);
    }

    /**
     * Gets the RGB value of a known color
    */
    //% weight=2 blockGap=8
    //% blockId="neopixel_colors" block="%color"
    //% advanced=true
    export function colors(color: NeoPixelColors): number {
        return color;
    }

    function packRGB(a: number, b: number, c: number): number {
        return ((a & 0xFF) << 16) | ((b & 0xFF) << 8) | (c & 0xFF);
    }
    function unpackR(rgb: number): number {
        let r = (rgb >> 16) & 0xFF;
        return r;
    }
    function unpackG(rgb: number): number {
        let g = (rgb >> 8) & 0xFF;
        return g;
    }
    function unpackB(rgb: number): number {
        let b = (rgb) & 0xFF;
        return b;
    }

    /**
     * Converts a hue saturation luminosity value into a RGB color
     * @param h hue from 0 to 360
     * @param s saturation from 0 to 99
     * @param l luminosity from 0 to 99
     */
    //% blockId=neopixelHSL block="hue %h|saturation %s|luminosity %l"
    export function hsl(h: number, s: number, l: number): number {
        h = Math.round(h);
        s = Math.round(s);
        l = Math.round(l);
        
        h = h % 360;
        s = Math.clamp(0, 99, s);
        l = Math.clamp(0, 99, l);
        let c = Math.idiv((((100 - Math.abs(2 * l - 100)) * s) << 8), 10000); //chroma, [0,255]
        let h1 = Math.idiv(h, 60);//[0,6]
        let h2 = Math.idiv((h - h1 * 60) * 256, 60);//[0,255]
        let temp = Math.abs((((h1 % 2) << 8) + h2) - 256);
        let x = (c * (256 - (temp))) >> 8;//[0,255], second largest component of this color
        let r$: number;
        let g$: number;
        let b$: number;
        if (h1 == 0) {
            r$ = c; g$ = x; b$ = 0;
        } else if (h1 == 1) {
            r$ = x; g$ = c; b$ = 0;
        } else if (h1 == 2) {
            r$ = 0; g$ = c; b$ = x;
        } else if (h1 == 3) {
            r$ = 0; g$ = x; b$ = c;
        } else if (h1 == 4) {
            r$ = x; g$ = 0; b$ = c;
        } else if (h1 == 5) {
            r$ = c; g$ = 0; b$ = x;
        }
        let m = Math.idiv((Math.idiv((l * 2 << 8), 100) - c), 2);
        let r = r$ + m;
        let g = g$ + m;
        let b = b$ + m;
        return packRGB(r, g, b);
    }

    export enum HueInterpolationDirection {
        Clockwise,
        CounterClockwise,
        Shortest
    }
}
