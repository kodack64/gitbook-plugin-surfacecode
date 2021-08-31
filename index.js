module.exports = {
    website: {
        assets: "./static",
        js: [
            "two.min.js",
            "surfacecode.js",
        ],
    },
    blocks: {
        qcircuit: {
            process: function(blk) {
                return "<script>" + blk.body + "</script>";
            }
        }
    },
    hooks: {
        "page:before": function(page) {
            results = page.content.match(/{% qcircuit %}((.*[\r\n]+)+?)?{% endqcircuit %}/igm);
            if (results == null) return;

            let len = results.length;
            circuit_names = [];
            for (var circuit_index = 0; circuit_index < len; circuit_index++) {
                circuit_name = "__surfacecode" + String(circuit_index) + "__";
                circuit_names.push(circuit_name)
                new_str = results[circuit_index].replace("{% surfacecode %}", "{% surfacecode %}\n" + "var " + circuit_name + " = ");
                new_str += "\n<div id=\"" + circuit_name + "\"></div>\n"
                page.content = page.content.replace(results[circuit_index], new_str);
            }

            load_str = ""
            load_str += "\n<script>\n"
            load_str += "var circuit_list = {\n"
            for (let name of circuit_names) {
                load_str += "    \"" + name + "\": " + name + ",\n";
            }
            load_str += "}\n"
            load_str +=
                `
            function draw_circuit() {
                for(let key in circuit_list){
                    var element = document.getElementById(key);
                    if (element == null) continue;
                    var circuit = circuit_list[key];
                    drawer = new SurfaceCodeDrawer(element, circuit);
                    drawer.draw();
                }
            }
            if(document.readyState == 'loading'){
                window.addEventListener("load", draw_circuit);
            }else{
                draw_circuit();
            }\n
            `
            load_str += "</script>\n"
            page.content += load_str;
            return page;
        }
    }
};