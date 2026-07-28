const { response } = require('express');
const Categoria = require('../models/categoria');
const Portafolio = require('../models/portafolio');

const getTodo = async (req, res = response) => {

    // Si no viene búsqueda, usamos un string vacío en lugar de undefined
        const busqueda = req.params.busqueda || ''; 
        const statusFilter = req.query.status || null; 
        // Si la búsqueda está vacía, hacemos que machee con todo (.*) en lugar de fallar
        const regexStr = busqueda === '' ? '.*' : busqueda;
        const regex = new RegExp(regexStr, 'i');
    
        // First, find categories that match the search
        const categorias = await Categoria.find({ name: regex });
        const categoriaIds = categorias.map(cat => cat._id);
    
    
        // Then, find projects that match either name or category or pais in the list
        const portafoliosFilter = {
            $or: [
                { title: regex },
                { slug: regex },
                { description: regex },
                { category: { $in: categoriaIds } },
            ]
        };
        
        // 2. APLICAR EL FILTRO DE ESTADO EN LA BÚSQUEDA GLOBAL DE PROYECTOS
        if (statusFilter) {
            portafoliosFilter.status = statusFilter;
        }
    
        const [portafolios, categoria] = await Promise.all([
           
            Portafolio.find(portafoliosFilter).populate('category', 'title'),
            Categoria.find({ name: regex }),
        ]);
    
        res.json({
            ok: true,
            portafolios,
            categoria,
        });
}

const getDocumentosColeccion = async (req, res = response) => {

    const tabla = req.params.tabla;
    const busqueda = req.params.busqueda;
    const regex = new RegExp(busqueda, 'i');
    const statusFilter = req.query.status || null;

    let data = [];

    switch (tabla) {

        case 'portafolios':
            const categorias = await Categoria.find({ name: regex });
            const categoriaIds = categorias.map(cat => cat._id);

            let portafoliosFilter = {};

            // Si es una búsqueda real por texto, aplicamos el $or
            if (busqueda !== 'all') {
                portafoliosFilter.$or = [
                    { title: regex },
                    { slug: regex },
                    { description: regex },
                    { category: { $in: categoriaIds } }
                ];
            }

            // Aplicamos el filtro de estado de manera limpia
            if (statusFilter) {
                portafoliosFilter.status = statusFilter;
            }

            data = await Portafolio.find(portafoliosFilter).populate('category', 'name');
            break;
    }

    res.json({
        ok: true,
        resultados: data
    });
}

module.exports = {
    getTodo,
    getDocumentosColeccion
}