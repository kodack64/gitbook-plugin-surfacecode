class Position {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    toString() {
        return "(" + String(this.x) + "," + String(this.y) + ")";
    }
}

class Vertex {
    constructor(p) {
        this.p = p;
        this.F = new Set();
        this.E = new Set();
        this.dom = null;
        this.active = 0;
    }
}

class Edge {
    constructor(p) {
        this.p = p;
        this.F = new Set();
        this.V = new Set();
        this.dom = null;
        this.active = 0;
    }
}

class Face {
    constructor(p) {
        this.p = p;
        this.E = new Set();
        this.V = new Set();
        this.dom = null;
        this.active = 0;
    }
}


class EmbeddedGraph {
    constructor() {
        this.Vmap = {};
        this.Emap = {};
        this.Fmap = {};
    }
    add_vertex(p) {
        const key = p.toString();
        if (!(key in this.Vmap)) {
            this.Vmap[key] = new Vertex(p);
        }
    }
    add_edge(p) {
        const key = p.toString();
        if (!(key in this.Emap)) {
            this.Emap[key] = new Edge(p);
        }
    }
    add_face(p) {
        const key = p.toString();
        if (!(key in this.Fmap)) {
            this.Fmap[key] = new Face(p);
        }
    }
    register_face_edge(pf, pe) {
        const key_pf = pf.toString();
        const key_pe = pe.toString();
        console.assert(key_pf in this.Fmap);
        console.assert(key_pe in this.Emap);
        this.Fmap[key_pf].E.add(pe);
        this.Emap[key_pe].F.add(pf);
    }
    register_edge_vertex(pe, pv) {
        const key_pe = pe.toString();
        const key_pv = pv.toString();
        console.assert(key_pe in this.Emap);
        console.assert(key_pv in this.Vmap);
        this.Emap[key_pe].V.add(pv);
        this.Vmap[key_pv].E.add(pe);
    }
    register_face_vertex(pf, pv) {
        const key_pf = pf.toString();
        const key_pv = pv.toString();
        console.assert(key_pf in this.Fmap);
        console.assert(key_pv in this.Vmap);
        this.Fmap[key_pf].V.add(pv);
        this.Vmap[key_pv].F.add(pf);
    }
    bind_face_vertex_via_edge() {
        for (let key_pe in this.Emap) {
            const e = this.Emap[key_pe];
            for (let pv of e.V) {
                for (let pf of e.F) {
                    this.Vmap[pv.toString()].F.add(pf);
                    this.Fmap[pf.toString()].V.add(pv);
                }
            }
        }
    }
    bind_edge_via_face_vertex() {
        for (let key_pv in this.Vmap) {
            const v = this.Vmap[key_pv];
            const pe = v.p;
            const key_pe = key_pv;
            this.add_edge(pe);
            this.Emap[key_pe].add_vertex(pv);
            for (let pf of v.F) {
                key_pf = pf.toString();
                this.Fmap[key_pf].add_edge(pe);
                this.Emap[key_pe].add_face(pf);
            }
        }
    }
}

class CheckerGraph extends EmbeddedGraph {
    set_size(step) {
        this.step = step;
        this.step_x = step;
        this.step_y = step;
        this.vertex_radius = step * 0.2;
        this.vertex_linewidth = step * 0.1;
        this.edge_linewidth = step * 0.15;
        this.face_size = step * 1.0;
        this.face_rotation = 0;
    }
    initial_flip(errors, syndromes) {
        let edge_keys = Array.from(Object.keys(this.Emap));
        edge_keys.sort();
        for (let index of errors) {
            if (index < edge_keys.length)
                this.flip_edge(this.Emap[edge_keys[index]])
        }

        let vertex_keys = Array.from(Object.keys(this.Vmap));
        vertex_keys.sort();
        for (let index of syndromes) {
            if (index < vertex_keys.length)
                this.flip_vertex(this.Vmap[vertex_keys[index]])
        }
    }
    get_position_x(x) {
        return (x + 1) * this.step_x;
    };
    get_position_y(y) {
        return (y + 1) * this.step_y;
    };
    set_color_info(color_info) {
        this.color_info = color_info;
    }
    draw_vertex(two) {
        for (let key in this.Vmap) {
            const v = this.Vmap[key];
            const px = this.get_position_x(v.p.x);
            const py = this.get_position_y(v.p.y);
            let vertex = two.makeCircle(px, py, this.vertex_radius);
            vertex.fill = this.color_info.vertex_fill;
            if (v.active == 1) {
                vertex.stroke = this.color_info.vertex_stroke_active;
                vertex.linewidth = this.color_info.vertex_linewidth_ratio_active * this.step;
            } else {
                vertex.stroke = this.color_info.vertex_stroke_inactive;
                vertex.linewidth = this.color_info.vertex_linewidth_ratio_inactive * this.step;
            }
            v.dom = vertex;
        }
    }
    _draw_normal_edge(two, pv1, pv2) {
        const px = this.get_position_x(pv1.x);
        const py = this.get_position_y(pv1.y);
        const npx = this.get_position_x(pv2.x);
        const npy = this.get_position_y(pv2.y);
        let line = two.makeLine(px, py, npx, npy);
        return line;
    }
    _draw_boundary_edge(two, pv, pe) {
        const ex = this.get_position_x(pe.x);
        const ey = this.get_position_y(pe.y);
        const px = this.get_position_x(pv.x);
        const py = this.get_position_y(pv.y);
        const npx = px + (ex - px) * 2;
        const npy = py + (ey - py) * 2;
        let line = two.makeLine(px, py, npx, npy);
        return line
    }
    _draw_periodic_edge(two, pv1, pv2, pe) {
        let pv = null;
        if (Math.abs(pv1.x - pe.x) + Math.abs(pv1.y - pe.y) < Math.abs(pv2.x - pe.x) + Math.abs(pv2.y - pe.y)) {
            return this._draw_boundary_edge(two, pv1, pe);
        } else {
            return this._draw_boundary_edge(two, pv2, pe);
        }
    }
    draw_edge(two) {
        for (let key in this.Emap) {
            const e = this.Emap[key];
            const arr = Array.from(e.V);
            var obj = null;
            if (arr.length == 1) {
                obj = this._draw_boundary_edge(two, arr[0], e.p);
            } else if (arr.length == 2) {
                if ((arr[0].x + arr[1].x) / 2 == e.p.x && (arr[0].y + arr[1].y) / 2 == e.p.y) {
                    obj = this._draw_normal_edge(two, arr[0], arr[1]);
                } else {
                    obj = this._draw_periodic_edge(two, arr[0], arr[1], e.p);
                }
            } else {
                console.error("Invalid edge detected: ", e);
            }
            obj.linewidth = this.edge_linewidth;
            if (e.active == 1)
                obj.stroke = this.color_info.edge_stroke_active;
            else
                obj.stroke = this.color_info.edge_stroke_inactive;
            e.dom = obj;
        }
    }
    draw_face(two) {
        for (let key in this.Fmap) {
            const f = this.Fmap[key];
            const px = this.get_position_x(f.p.x);
            const py = this.get_position_y(f.p.y);
            let face = two.makeRectangle(px, py, this.face_size, this.face_size);
            face.fill = this.color_info.face_fill;
            face.rotation = this.face_rotation;
            face.noStroke();
            f.dom = face;
        }
    }


    flip_vertex(v) {
        //console.log("act vert", v.p);
        v.active ^= 1;
        if (v.active == 1) {
            v.dom.stroke = this.color_info.vertex_stroke_active;
            v.dom.linewidth = this.color_info.vertex_linewidth_ratio_active * this.step;
        } else {
            v.dom.stroke = this.color_info.vertex_stroke_inactive;
            v.dom.linewidth = this.color_info.vertex_linewidth_ratio_inactive * this.step;
        }
    }
    flip_edge(e) {
        //console.log("act edge", e.p, e.V);
        e.active ^= 1;
        if (e.active == 1) {
            e.dom.stroke = this.color_info.edge_stroke_active;
        } else {
            e.dom.stroke = this.color_info.edge_stroke_inactive;
        }
        for (let pv of e.V) {
            const key_pv = pv.toString();
            const v = this.Vmap[key_pv];
            this.flip_vertex(v);
        }
    }
    flip_face(f) {
        //console.log("act face", f.p, f.E);
        for (let pe of f.E) {
            const key_pe = pe.toString();
            const e = this.Emap[key_pe];
            this.flip_edge(e);
        }
    }
    get_reaction_vertex(v) {
        const func = (_e) => {
            //console.log("vertex", v.p);
        }
        return func;
    }
    get_reaction_edge(e) {
        const func = (_e) => {
            //console.log("edge", e.p);
            this.flip_edge(e);
        }
        return func;
    }
    get_reaction_face(f) {
        const func = (_e) => {
            //console.log("face", f.p);
            this.flip_face(f);
        }
        return func;
    }
    bind_graph(two, info) {
        /*
        for (let key in this.Vmap) {
            const v = this.Vmap[key];
            const func = this.get_reaction_vertex(v);
            //($(v.dom._renderer.elem)).css("cursor", "pointer").click(func)
            ($(v.dom._renderer.elem)).click(func)
        }
        */
        if (info.bind_error) {
            for (let key in this.Emap) {
                var e = this.Emap[key];
                const func = this.get_reaction_edge(e);
                ($(e.dom._renderer.elem)).css("cursor", "pointer").click(func);
            }
        }
        if (info.bind_stabilizer) {
            for (let key in this.Fmap) {
                var f = this.Fmap[key];
                const func = this.get_reaction_face(f);
                ($(f.dom._renderer.elem)).css("cursor", "pointer").click(func);
            }

        }
        two.update();
    }
}

class TopologicalCodeBase {
    constructor(info) {
        this.info = info;
        this.distance = info.distance;
    }
    build() {
        console.error("this is base class");
    }
    draw() {
        console.error("this is base class")
    }
}

class SurfaceCodeBase extends TopologicalCodeBase {
    constructor(info) {
        super(info);
        this.primal = new CheckerGraph();
        this.dual = new CheckerGraph();
        this.build();

        const primal_color = {
            vertex_fill: "#8888cc",
            vertex_stroke_active: "#cc0000",
            vertex_stroke_inactive: "#000000",
            vertex_linewidth_ratio_active: 0.1,
            vertex_linewidth_ratio_inactive: 0.05,
            edge_stroke_active: "#cc0000",
            edge_stroke_inactive: "#ccaaaa",
            edge_linewidth: 0.2,
            face_fill: "#eeaabb",
        }
        const dual_color = {
            vertex_fill: "#cc8888",
            vertex_stroke_active: "#0000cc",
            vertex_stroke_inactive: "#000000",
            vertex_linewidth_ratio_active: 0.1,
            vertex_linewidth_ratio_inactive: 0.05,
            edge_stroke_active: "#0000cc",
            edge_stroke_inactive: "#aaaacc",
            edge_linewidth: 0.2,
            face_fill: "#bbaaee",
        }
        this.primal.set_color_info(primal_color);
        this.dual.set_color_info(dual_color);
    }
    adjust() {
        const step = this.info.size / (this.distance + 1) / 2;
        this.primal.set_size(step);
        this.dual.set_size(step);
    }
    draw(two) {
        if (this.info.show_primal)
            this.primal.draw_face(two);
        if (this.info.show_dual)
            this.dual.draw_face(two);
        if (this.info.show_primal)
            this.primal.draw_edge(two);
        if (this.info.show_dual)
            this.dual.draw_edge(two);
        if (this.info.show_primal)
            this.primal.draw_vertex(two);
        if (this.info.show_dual)
            this.dual.draw_vertex(two);
    }
    initial_flip() {
        if (this.info.initial_error[0] instanceof Array) {
            var error_primal = this.info.initial_error[0]
            var error_dual = this.info.initial_error[1]
        } else {
            var error_primal = this.info.initial_error
            var error_dual = this.info.initial_error
        }
        if (this.info.initial_syndrome[0] instanceof Array) {
            var syndrome_primal = this.info.initial_syndrome[0]
            var syndrome_dual = this.info.initial_syndrome[1]
        } else {
            var syndrome_primal = this.info.initial_syndrome
            var syndrome_dual = this.info.initial_syndrome
        }
        if (this.info.show_primal)
            this.primal.initial_flip(error_primal, syndrome_primal);
        if (this.info.show_dual)
            this.dual.initial_flip(error_dual, syndrome_dual);
    }
    bind_func(two) {
        if (this.info.show_primal)
            this.primal.bind_graph(two, this.info);
        if (this.info.show_dual)
            this.dual.bind_graph(two, this.info);
    }
}

class SurfaceCode extends SurfaceCodeBase {
    /*
    primal (X-error / Z-parity-check)
         0 1 2 3 4 5 6 7 8 9 10
    0:
    1: bnd - v - v - v - v - bnd
    2:       |   |   |   |   
    3: bnd - v - v - v - v - bnd
    4:       |   |   |   |   
    5: bnd - v - v - v - v - bnd
    6:       |   |   |   |   
    7: bnd - v - v - v - v - bnd
    8:       |   |   |   |   
    9: bnd - v - v - v - v - bnd
    10:

    dual (Z-error / X-parity-check)
         0 1 2 3 4 5 6 7 8 9 10
    0:     b   b   b   b   b
    1:     |   |   |   |   |
    2:     v - v - v - v - v
    3:     |   |   |   |   |
    4:     v - v - v - v - v
    5:     |   |   |   |   |
    6:     v - v - v - v - v
    7:     |   |   |   |   |
    8:     v - v - v - v - v
    9:     |   |   |   |   |
    10:    b   b   b   b   b
    */
    build() {
        const d = this.distance;

        const dx = [-1, 1, 0, 0];
        const dy = [0, 0, -1, 1];
        for (let y = 1; y < 2 * d; y += 1) {
            for (let x = 2 - (y % 2); x < 2 * d; x += 2) {
                const pos = new Position(x, y);
                this.primal.add_edge(pos);
                this.dual.add_edge(pos);
                const is_odd_line = (y % 2 == 1);
                for (let k = 0; k < dx.length; ++k) {
                    const npos = new Position(x + dx[k], y + dy[k]);
                    if (npos.x == 0) continue;
                    if (npos.x == 2 * d) continue;
                    if (npos.y == 0) continue;
                    if (npos.y == 2 * d) continue;
                    const is_x_move = (dx[k] != 0);
                    if (is_odd_line ^ is_x_move) {
                        this.primal.add_face(npos);
                        this.primal.register_face_edge(npos, pos);
                        this.dual.add_vertex(npos);
                        this.dual.register_edge_vertex(pos, npos);
                    } else {
                        this.primal.add_vertex(npos);
                        this.primal.register_edge_vertex(pos, npos);
                        this.dual.add_face(npos);
                        this.dual.register_face_edge(npos, pos);
                    }
                }
            }
        }
        this.primal.bind_face_vertex_via_edge();
        this.dual.bind_face_vertex_via_edge();
    }
}

class SurfaceCodePeriodic extends SurfaceCodeBase {
    /*
    primal (X-error / Z-parity-check)
         0 1 2 3 4 5 6 7 8 9
    0:   |   |   |   |   |
    1:   v - v - v - v - v - 
    2:   |   |   |   |   |   
    3:   v - v - v - v - v - 
    4:   |   |   |   |   |   
    5:   v - v - v - v - v -
    6:   |   |   |   |   |  
    7:   v - v - v - v - v -
    8:   |   |   |   |   |   
    9:   v - v - v - v - v -

    dual (Z-error / X-parity-check)
         0 1 2 3 4 5 6 7 8 9 10
    0:   - v - v - v - v - v
    1:     |   |   |   |   |
    2:   - v - v - v - v - v
    3:     |   |   |   |   |
    4:   - v - v - v - v - v
    5:     |   |   |   |   |
    6:   - v - v - v - v - v
    7:     |   |   |   |   |
    8:   - v - v - v - v - v
    9:     |   |   |   |   |
    */
    build() {
        const d = this.distance;
        const dx = [-1, 1, 0, 0];
        const dy = [0, 0, -1, 1];
        for (let y = 0; y < 2 * d; y += 1) {
            for (let x = (y % 2); x < 2 * d; x += 2) {
                const pos = new Position(x, y);
                this.primal.add_edge(pos);
                this.dual.add_edge(pos);
                const is_odd_line = (y % 2 == 1);
                for (let k = 0; k < dx.length; ++k) {
                    const npos = new Position((x + dx[k] + 2 * d) % (2 * d), (y + dy[k] + 2 * d) % (2 * d));
                    const is_x_move = (dx[k] != 0);
                    if (is_odd_line ^ is_x_move) {
                        this.primal.add_vertex(npos);
                        this.primal.register_edge_vertex(pos, npos);
                        this.dual.add_face(npos);
                        this.dual.register_face_edge(npos, pos);
                    } else {
                        this.primal.add_face(npos);
                        this.primal.register_face_edge(npos, pos);
                        this.dual.add_vertex(npos);
                        this.dual.register_edge_vertex(pos, npos);
                    }
                }
            }
        }
        this.primal.bind_face_vertex_via_edge();
        this.dual.bind_face_vertex_via_edge();
    }
}

class SurfaceCodeRotated extends SurfaceCodeBase {
    /*
    primal (X-error / Z-parity-check)
       0 1 2 3 4 5 6 7 8 9 10
    0:     v       v       b
    1:   e   e   e   e   e
    2: b       v       v   
    3:   e   e   e   e   e
    4:     v       v       b
    5:   e   e   e   e   e
    6: b       v       v   
    7:   e   e   e   e   e
    8:     v       v       b
    9:   e   e   e   e   e
    10:b       v       v   

    dual (Z-error / X-parity-check)
       0 1 2 3 4 5 6 7 8 9 10
    0: b       b       b
    1:   e   e   e   e   e
    2:     v       v       v
    3:   e   e   e   e   e
    4: v       v       v
    5:   e   e   e   e   e
    6:     v       v       v
    7:   e   e   e   e   e
    8: v       v       v
    9:   e   e   e   e   e
    10:    b       b       b
    */
    build() {
        const d = this.distance;
        const dx = [1, 1, -1, -1];
        const dy = [1, -1, 1, -1];
        for (let y = 1; y < 2 * d; y += 2) {
            for (let x = 1; x < 2 * d; x += 2) {
                const pos = new Position(x, y);
                this.primal.add_edge(pos);
                this.dual.add_edge(pos);
                const is_even = ((x + y) % 4 == 2);
                for (let k = 0; k < dx.length; ++k) {
                    const npos = new Position(x + dx[k], y + dy[k]);
                    if (npos.x == 0 && npos.y % 4 == 2) continue;
                    if (npos.y == 0 && npos.x % 4 == 0) continue;
                    if (npos.x == 2 * d && npos.y % 4 == 2 * (1 - (d % 2))) continue;
                    if (npos.y == 2 * d && npos.x % 4 == 2 * (d % 2)) continue;
                    const is_RU_move = (Math.abs(dx[k] + dy[k]) == 2);
                    if (is_even ^ is_RU_move) {
                        this.primal.add_vertex(npos);
                        this.primal.register_edge_vertex(pos, npos);
                        this.dual.add_face(npos);
                        this.dual.register_face_edge(npos, pos);
                    } else {
                        this.primal.add_face(npos);
                        this.primal.register_face_edge(npos, pos);
                        this.dual.add_vertex(npos);
                        this.dual.register_edge_vertex(pos, npos);
                    }
                }
            }
        }
        this.primal.bind_face_vertex_via_edge();
        this.dual.bind_face_vertex_via_edge();
    }
    adjust() {
        super.adjust();
        this.primal.face_rotation = Math.PI / 4;
        this.dual.face_rotation = Math.PI / 4;
    }
}

class ThreeColorableGraph extends EmbeddedGraph {
    constructor(distance) {
        super(distance);
        this.Fmap_color = {}
    }
    add_colored_face(p, color) {
        this.add_face(p);
        this.Fmap_color[p.toString()] = color;
    }
    set_size(step, lattice_width) {
        this.lattice_width = lattice_width;
        this.lattice_height = (lattice_width + 1) / 2;
        this.step_x = step;
        this.step_y = step * Math.sqrt(3);

        this.vertex_radius = step * 0.3;
        this.vertex_linewidth = step * 0.05;
        this.vertex_stroke_color = "#000000";
        this.face_size = step * 1.0;
        this.face_rotation = 0;
        this.face_stroke = 3;
    }
    initial_flip(errors, syndromes) {
        let vertex_keys = Array.from(Object.keys(this.Vmap));
        vertex_keys.sort();
        for (let index of errors) {
            if (index < vertex_keys.length)
                this.flip_vertex(this.Vmap[vertex_keys[index]], true, true);
        }

        let face_keys = Array.from(Object.keys(this.Fmap));
        face_keys.sort();
        for (let index of syndromes) {
            if (index < face_keys.length)
                this.flip_face(this.Fmap[face_keys[index]], true, false);
        }
    }
    get_position_x(x) {
        return (x + 1) * this.step_x;
    };
    get_position_y(y) {
        return (this.lattice_height - y) * this.step_y;
    };
    set_color_info(color_info) {
        this.color_info = color_info;
    }
    draw_vertex(two) {
        for (let key in this.Vmap) {
            const v = this.Vmap[key];
            const px = this.get_position_x(v.p.x);
            const py = this.get_position_y(v.p.y);
            let vertex = two.makeCircle(px, py, this.vertex_radius);
            vertex.linewidth = this.vertex_linewidth
            vertex.stroke = this.vertex_stroke_color;
            if (v.active == 1) {
                vertex.fill = this.color_info.vertex_fill_active;
            } else {
                vertex.fill = this.color_info.vertex_fill_inactive;
            }
            v.dom = vertex;
        }
    }
    draw_edge(two) {}



    flip_vertex(v, flip, effect) {
        //console.log("act vert", v.p);
        if (flip) {
            v.active ^= 1;
            if (v.active == 1) {
                v.dom.fill = this.color_info.vertex_fill_active;
            } else {
                v.dom.fill = this.color_info.vertex_fill_inactive;
            }
        }

        if (effect) {
            for (let pf of v.F) {
                const key_pf = pf.toString();
                const f = this.Fmap[key_pf];
                this.flip_face(f, true, false);
            }
        }
    }
    flip_edge(e, flip, effect) {
        //console.log("act edge", e.p, e.V);
    }
    flip_face(f, flip, effect) {
        //console.log("act face", f.p, f.E);
        if (flip) {
            f.active ^= 1;
            const color = this.Fmap_color[f.p.toString()]
            if (f.active == 1) {
                f.dom.fill = this.color_info.face_fill_active[color];
            } else {
                f.dom.fill = this.color_info.face_fill_inactive[color];
            }
        }

        if (effect) {
            for (let pv of f.V) {
                const key_pv = pv.toString();
                const v = this.Vmap[key_pv];
                this.flip_vertex(v, true, true);
            }
        }
    }
    get_reaction_vertex(v) {
        const func = (_e) => {
            //console.log("vertex", v.p);
            this.flip_vertex(v, true, true);
        }
        return func;
    }
    get_reaction_edge(e) {
        const func = (_e) => {
            //console.log("edge", e.p);
            //this.flip_edge(e);
        }
        return func;
    }
    get_reaction_face(f) {
        const func = (_e) => {
            //console.log("face", f.p);
            this.flip_face(f, false, true);
        }
        return func;
    }
    bind_graph(two, info) {
        if (info.bind_error) {
            for (let key in this.Vmap) {
                const v = this.Vmap[key];
                const func = this.get_reaction_vertex(v);
                ($(v.dom._renderer.elem)).css("cursor", "pointer").click(func)
            }
        }
        /*
        for (let key in this.Emap) {
            var e = this.Emap[key];
            const func = this.get_reaction_edge(e);
            //($(e.dom._renderer.elem)).css("cursor", "pointer").click(func);
            ($(v.dom._renderer.elem)).click(func)
        }
        */
        if (info.bind_stabilizer) {
            for (let key in this.Fmap) {
                var f = this.Fmap[key];
                const func = this.get_reaction_face(f);
                ($(f.dom._renderer.elem)).css("cursor", "pointer").click(func);
            }
        }
        two.update();
    }
}
class ThreeColorableGraphBoundary extends ThreeColorableGraph {
    draw_face(two) {
        for (let pf in this.Fmap) {
            const f = this.Fmap[pf];
            const color = this.Fmap_color[pf];
            let anchor_list = [];
            for (let pv of f.V) {
                const px = this.get_position_x(pv.x);
                const py = this.get_position_y(pv.y);
                let anchor = new Two.Anchor(px, py);
                anchor_list.push(anchor);
            }
            let face = two.makePath(anchor_list);
            if (f.active == 1)
                face.fill = this.color_info.face_fill_active[color];
            else
                face.fill = this.color_info.face_fill_inactive[color];
            face.linewidth = this.face_stroke;
            f.dom = face;
        }
    }
}
class ThreeColorableGraphPeriodic extends ThreeColorableGraph {
    draw_face(two) {
        const dx = [-2, -1, 1, 2, 1, -1];
        const dy = [0, -1, -1, 0, 1, 1];
        for (let pf in this.Fmap) {
            const f = this.Fmap[pf];
            const color = this.Fmap_color[pf];
            let anchor_list = [];
            for (let k = 0; k < dx.length; k += 1) {
                const nx = f.p.x + dx[k];
                const ny = f.p.y + dy[k];
                const px = this.get_position_x(nx);
                const py = this.get_position_y(ny);
                let anchor = new Two.Anchor(px, py);
                anchor_list.push(anchor);
            }
            let face = two.makePath(anchor_list);
            if (f.active == 1)
                face.fill = this.color_info.face_fill_active[color];
            else
                face.fill = this.color_info.face_fill_inactive[color];
            face.linewidth = this.face_stroke;
            f.dom = face;
        }
    }
}

class ColorCodeBase extends TopologicalCodeBase {
    constructor(distance) {
        super(distance);
        this.build();

        const color_info = {
            vertex_fill_active: "#000000",
            vertex_fill_inactive: "#eeeeee",
            vertex_stroke: "#000000",
            face_fill_active: ["#ff0000", "#00ff00", "#0000ff"],
            face_fill_inactive: ["#ffcccc", "#ccffcc", "#ccccff"],
        }
        this.graph.set_color_info(color_info)
    }
    draw(two) {
        this.graph.draw_face(two);
        this.graph.draw_edge(two);
        this.graph.draw_vertex(two);
    }
    initial_flip() {
        this.graph.initial_flip(this.info.initial_error, this.info.initial_syndrome);
    }
    bind_func(two) {
        this.graph.bind_graph(two, this.info)
    }
}

class ColorCode666 extends ColorCodeBase {
    /*
    Color code is self-dual
         0 1 2 3 4 5 6 7 8 9 101112
    0:   v   r   v   v   r   v   v
    1:     v   v   b   v   v   b
    2:       g   v   v   g   v
    3:         v   r   v   v
    4:           v   v   b
    5:             g   v
    6:               v
    */
    adjust() {
        const lattice_width = 1 + 3 * (this.distance - 1);
        const step = this.info.size / (lattice_width + 1);
        this.graph.set_size(step, lattice_width);
    }
    build() {
        this.graph = new ThreeColorableGraphBoundary();
        const d = this.distance;
        if (d % 2 == 0) {
            console.error("distance must be odd");
            return;
        }
        const height = 1 + 3 * (d - 1) / 2;
        const width = height * 2 - 1;
        const is_bounded = (x, y) => {
            if ((x + y) % 2 != 0) return false;
            if (y < 0) return false;
            if (y >= height) return false;
            if (x < y) return false;
            if (x >= width - y) return false;
            return true;
        }
        const dx = [-2, -1, 1, 2, 1, -1];
        const dy = [0, -1, -1, 0, 1, 1];
        for (let y = 0; y < height; y += 1) {
            const line_width = width - y;
            for (let x = y; x < line_width; x += 2) {
                const is_face = (y % 2 == 0 && x % 6 == 2) || (y % 2 == 1 && x % 6 == 5);
                if (!is_face) continue;
                const face_color = y % 3;
                const pos = new Position(x, y);
                this.graph.add_colored_face(pos, face_color);
                for (let k = 0; k < dx.length; k += 1) {
                    const nx = x + dx[k];
                    const ny = y + dy[k];
                    const npos = new Position(nx, ny)
                    if (!is_bounded(nx, ny)) continue;
                    this.graph.add_vertex(npos);
                    this.graph.register_face_vertex(pos, npos);
                }
            }
        }
    }
}

class ColorCode666Periodic extends ColorCodeBase {
    /*
    Color code is self-dual

    upper-to-down periodicity is half-shifted
         0 1 2 3 4 5
    0:   v   r   v
    1:     v   v   b
    2:   v   g   v  

         0 1 2 3 4 5 6 7 8 9 1011
    0:   v   r   v   v   r   v
    1:     v   v   b   v   v   b
    2:   v   g   v   v   g   v
    3:     v   v   r   v   v   r
    4:   v   b   v   v   b   v
    5:     v   v   g   v   v   g

         0 1 2 3 4 5 6 7 8 9 1011121314151617
    0:   v   r   v   v   r   v   v   r   v
    1:     v   v   b   v   v   b   v   v   b
    2:   v   g   v   v   g   v   v   g   v
    3:     v   v   r   v   v   r   v   v   r
    4:   v   b   v   v   b   v   v   b   v
    5:     v   v   g   v   v   g   v   v   g
    6:   v   r   v   v   r   v   v   r   v
    7:     v   v   b   v   v   b   v   v   b
    8:   v   g   v   v   g   v   v   g   v

    */
    adjust() {
        const lattice_width = 3 * this.distance + 1;
        const step = this.info.size / (lattice_width + 1);
        this.graph.set_size(step, lattice_width);
    }
    build() {
        this.graph = new ThreeColorableGraphPeriodic();
        const d = this.distance;
        if (d % 2 == 1) {
            console.error("distance must be even");
            return;
        }
        const height = 3 * d / 2;
        const width = 3 * d;
        const is_bounded = (x, y) => {
            if ((x + y) % 2 != 0) return false;
            if (y < 0) return false;
            if (y >= height) return false;
            if (x < 0) return false;
            if (x >= width) return false;
            return true;
        }
        const dx = [-2, -1, 1, 2, 1, -1];
        const dy = [0, -1, -1, 0, 1, 1];
        for (let y = 0; y < height; y += 1) {
            for (let x = y % 2; x < width; x += 2) {
                const is_face = (y % 2 == 0 && x % 6 == 2) || (y % 2 == 1 && x % 6 == 5);
                if (!is_face) continue;
                const face_color = y % 3;
                const pos = new Position(x, y);
                this.graph.add_colored_face(pos, face_color);
                for (let k = 0; k < dx.length; k += 1) {
                    let nx = x + dx[k];
                    let ny = y + dy[k];
                    if (ny < 0) {
                        ny = ny + height;
                        if (d % 4 == 2) nx += 3;
                    } else if (ny >= height) {
                        ny = ny - height;
                        if (d % 4 == 2) nx -= 3;
                    }
                    nx = (nx + width) % width;
                    const npos = new Position(nx, ny)
                    console.assert(is_bounded(nx, ny));
                    this.graph.add_vertex(npos);
                    this.graph.register_face_vertex(pos, npos);
                }
            }
        }
    }
}


class TopologicalCodeDrawer {
    constructor(tag, info) {
        if (!("show_primal" in info)) {
            info.show_primal = true;
        }
        if (!("show_dual" in info)) {
            info.show_dual = true;
        }
        if (!("bind_error" in info)) {
            info.bind_error = true;
        }
        if (!("bind_stabilizer" in info)) {
            info.bind_stabilizer = true;
        }
        if (!("initial_error" in info)) {
            info.initial_error = [];
        }
        if (!("initial_syndrome" in info)) {
            info.initial_syndrome = [];
        }

        this.first_draw = true;
        this.tag = tag;
        this.info = info;
        if (this.info.type == "surface_code") {
            this.code = new SurfaceCode(info);
        } else if (this.info.type == "surface_code_rotate") {
            this.code = new SurfaceCodeRotated(info);
        } else if (this.info.type == "surface_code_periodic") {
            this.code = new SurfaceCodePeriodic(info);
        } else if (this.info.type == "color_code_666") {
            this.code = new ColorCode666(info);
        } else if (this.info.type == "color_code_666_periodic") {
            this.code = new ColorCode666Periodic(info);
        } else {
            console.error("Unknown code");
        }
        this.code.adjust();
        this.canvas_size = this.info.size;

        var params = { width: this.canvas_size, height: this.canvas_size, autostart: true };
        this.two = new Two(params).appendTo(this.tag);
    }
    draw() {
        this.code.draw(this.two);
        this.code.initial_flip();
        this.two.update();
        if (this.first_draw) {
            this.first_draw = false;
            this.code.bind_func(this.two);
        }
    }
}