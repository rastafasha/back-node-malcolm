const { response } = require('express');
const Portafolio = require('../models/portafolio');
const Categoria = require('../models/categoria');
const bcrypt = require('bcryptjs');
const { generarJWT } = require('../helpers/jwt');
const translate = require('google-translate-api-x');
const mongoose = require('mongoose');

const getPortafolios = async (req, res) => {

   try {
           const portafolios = await Portafolio.find()
               .sort({ createdAt: -1 })
               .populate('category')
           // .populate('ProjectType');
           //traemos las tareas en orden de ultima fecha
           portafolios.sort((a, b) => b.createdAt - a.createdAt);
   
   
           res.json({
               ok: true,
               portafolios
           });
       } catch (error) {
           return res.status(500).json({ message: 'Error al obtener proyectos' });
       }
};


const getPortafolio = async (req, res) => {

    const id = req.params.id;
    const uid = req.uid;

    Portafolio.findById(id)
        .populate('category')
        .exec((err, portafolio) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'Error al buscar portafolio',
                    errors: err
                });
            }
            if (!portafolio) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'El portafolio con el id ' + id + 'no existe',
                    errors: { message: 'No existe un portafolio con ese ID' }
                });

            }
            res.status(200).json({
                ok: true,
                portafolio: portafolio
            });
        });
};

const crearPortafolio = async (req, res) => {
  const uid = req.uid;

  // 1. Generación correcta y segura del SLUG sin pérdida de caracteres
  const title = req.body.title || '';
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/ñ/g, 'n')               // Reemplaza la eñe primero
    .normalize('NFD')                 // Descompone caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '')   // Elimina los símbolos de acentos sueltos
    .replace(/[\s]+/g, '-')           // Espacios a guiones
    .replace(/[^\w\-]+/g, '')         // Limpia caracteres especiales restantes
    .replace(/\-\-+/g, '-');          // Reduce guiones múltiples a uno solo

  // Extraemos los textos crudos en español del body
  const textoDescription = req.body.description || '';
  
  // Generamos el límite de caracteres en español para introhome
  const introhomeEs = textoDescription.substring(0, 100);

  try {
    // 🚀 TRADUCCIÓN EN PARALELO: Traducimos de Español a Inglés usando Promise.all
    const [traducirTitle, traducirDescription, traducirIntrohome] = await Promise.all([
      translate(title, { from: 'es', to: 'en' }),
      translate(textoDescription, { from: 'es', to: 'en' }),
      translate(introhomeEs, { from: 'es', to: 'en' })
    ]);

    // 2. Crear la instancia adaptada al esquema bilingüe de MongoDB
    const portafolio = new Portafolio({
      ...req.body, // Trae el resto de campos (links, imágenes, tecnologías, etc.)
      usuario: uid,
      slug: slug,
      
      // Reestructuramos las propiedades de texto plano a sub-objetos { es, en }
      title: {
        es: title,
        en: traducirTitle.text
      },
      description: {
        es: textoDescription,
        en: traducirDescription.text
      },
      introhome: {
        es: introhomeEs,
        en: traducirIntrohome.text // Traduce directamente el resumen recortado
      }
    });

    // 3. Guardar en la Base de Datos
    const portafolioDB = await portafolio.save();
    
    res.json({ 
      ok: true, 
      portafolio: portafolioDB 
    });

  } catch (error) {
    console.error('Error al crear portafolio:', error); // Rastro visible en tus logs
    res.status(500).json({ 
      ok: false, 
      msg: 'Hable con el admin',
      error: error.message 
    });
  }
};
const actualizarPortafolio = async (req, res) => {
  const id = req.params.id;
  const uid = req.uid;

  try {
    const portafolio = await Portafolio.findById(id);
    if (!portafolio) {
      return res.status(404).json({ // Cambiado a 404 que es el código correcto para no encontrado
        ok: false, 
        msg: 'Portafolio no encontrado por el id' 
      });
    }

    // Inicializamos el objeto con los campos básicos
    const cambiosPortafolio = { 
      ...req.body, 
      usuario: uid 
    };

    // Arrays para gestionar las promesas de traducción dinámicamente
    const translationPromises = [];
    const translationKeys = [];

    // 1. Si viene el título, actualizamos slug y traducimos título
    if (req.body.title) {
      const title = req.body.title;
      const slug = title
        .toLowerCase()
        .trim()
        .replace(/ñ/g, 'n')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[\s]+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-');

      cambiosPortafolio.slug = slug;

      // Encolamos la traducción del título
      translationPromises.push(translate(title, { from: 'es', to: 'en' }));
      translationKeys.push('title');
    }

    // 2. Si viene la descripción, traducimos la descripción completa
    if (req.body.description) {
      translationPromises.push(translate(req.body.description, { from: 'es', to: 'en' }));
      translationKeys.push('description');

      // Si el frontend NO envió un 'introhome' explícito pero sí cambió la descripción,
      // regeneramos automáticamente el introhome recortado en base a la nueva descripción.
      if (!req.body.introhome) {
        const introhomeEs = req.body.description.substring(0, 100);
        translationPromises.push(translate(introhomeEs, { from: 'es', to: 'en' }));
        translationKeys.push('introhome_auto'); // Bandera para procesarlo abajo
        
        cambiosPortafolio.introhome = { es: introhomeEs };
      }
    }

    // 3. Si viene un introhome explícito desde el body, lo procesamos y traducimos
    if (req.body.introhome) {
      const introhomeEs = req.body.introhome.substring(0, 100);
      
      translationPromises.push(translate(introhomeEs, { from: 'es', to: 'en' }));
      translationKeys.push('introhome_direct');

      cambiosPortafolio.introhome = { es: introhomeEs };
    }

    // 🚀 EJECUCIÓN EN PARALELO: Solo si hay campos que traducir
    if (translationPromises.length > 0) {
      const translationsResults = await Promise.all(translationPromises);

      // Asignamos los resultados bilingües estructurados según las claves procesadas
      translationsResults.forEach((result, index) => {
        const key = translationKeys[index];

        if (key === 'title') {
          cambiosPortafolio.title = {
            es: req.body.title,
            en: result.text
          };
        }
        if (key === 'description') {
          cambiosPortafolio.description = {
            es: req.body.description,
            en: result.text
          };
        }
        if (key === 'introhome_auto') {
          // Asigna la traducción al objeto que ya habíamos preparado arriba
          cambiosPortafolio.introhome.en = result.text;
        }
        if (key === 'introhome_direct') {
          cambiosPortafolio.introhome = {
            es: req.body.introhome.substring(0, 100),
            en: result.text
          };
        }
      });
    }

    // 4. Ejecutar la actualización en MongoDB
    const portafolioActualizado = await Portafolio.findByIdAndUpdate(
      id, 
      cambiosPortafolio, 
      { new: true, runValidators: true }
    );

    res.json({ 
      ok: true, 
      portafolioActualizado 
    });

  } catch (error) {
    console.error('Error al actualizar portafolio:', error);
    res.status(500).json({ 
      ok: false, 
      msg: 'Error hable con el admin',
      error: error.message
    });
  }
};


const borrarPortafolio = async (req, res) => {

    const uid = req.params.id;

    try {

        const portafolioDB = await Portafolio.findById(uid);
        if (!portafolioDB) {
            return res.status(404).json({
                ok: false,
                msg: 'No existe el portafolio por ese id'
            });
        }

        await Portafolio.findByIdAndDelete(uid);

        res.json({
            ok: true,
            msg: 'Portafolio eliminado'
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Error inesperado'
        });
    }
};

const listarPorCategoria = async (req, res) => {
    var name = req.params['nombre'];
    // 1. CAPTURAR EL NUEVO FILTRO DE ESTADO DESDE LA QUERY URL
    const estadoFilter = req.query.estado_seguimiento || null;

    try {
        // First, find the category by name
        const Categoria = require('../models/categoria');
        const categoria = await Categoria.findOne({ name: name });
        
        if (!categoria) {
            return res.status(404).json({ message: 'Categoría no encontrada' });
        }
        
        // 2. CONSTRUIR EL FILTRO DE BÚSQUEDA DINÁMICO
        let portafoliosFilter = { category: categoria._id };

        // Si el usuario envió un estado, lo agregamos al filtro de la consulta
        if (estadoFilter) {
            portafoliosFilter.estado_seguimiento = estadoFilter;
        }
        
        // Then, find portafolios using the category's ObjectId and the filters
        const portafolios = await Portafolio.find(portafoliosFilter)
            .populate('category');
        
        res.status(200).send({ portafolios: portafolios });
    } catch (err) {
        res.status(500).send({ error: err });
    }
}

const listarPorCategoriaId = async (req, res) => {
    const { id } = req.params; 
    const estadoFilter = req.query.estado_seguimiento || null;

    // 1. Revisa qué llega en la consola de tu terminal
    console.log("ID recibido desde la URL:", id);
    console.log("Tipo de dato del ID:", typeof id);

    try {
        // Intenta con findById si es el ID largo de Mongo (24 caracteres hexadecimales)
        const categoria = await Categoria.findById(id); 
        
        // Si usas un campo 'id' personalizado y numérico, usa:
        // const categoria = await Categoria.findOne({ id: Number(id) });

        console.log("Resultado de la búsqueda en BD:", categoria);

        if (!categoria) {
            return res.status(404).json({ message: 'Categoría no encontrada en la base de datos' });
        }

        let portafoliosFilter = { category: categoria._id };
        if (estadoFilter) { portafoliosFilter.estado_seguimiento = estadoFilter; }

        const portafolios = await Portafolio.find(portafoliosFilter).populate('category');
        return res.status(200).json({ portafolios });

    } catch (err) {
        console.error("Error exacto de Mongo:", err);
        return res.status(500).json({ message: 'Error en el servidor', error: err.message });
    }
};
const migrarPortafolioBilingue = async (req, res) => {
  try {
    // 1. FORZAR LA CONEXIÓN: Si la base de datos no está lista, la conectamos explícitamente
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB no estaba conectado. Conectando ahora...');
      
      // Usa tu variable de entorno exacta (ej: process.env.MONGODB_CNN o MONGODB_URI)
      const mongoUri = process.env.MONGODB_CNN || process.env.MONGODB_URI; 
      
      if (!mongoUri) {
        return res.status(500).json({
          ok: false,
          msg: 'Error: No se encontró la variable de entorno de conexión a MongoDB.'
        });
      }

      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000 // Si en 5 segundos no conecta a Atlas, tira error claro
      });
      console.log('¡Conexión a MongoDB establecida con éxito desde el script!');
    }

    // 2. Traemos todos los portafolios (Ahora con la conexión 100% garantizada)
    const portafolios = await Portafolio.find({});
    let totalMigrados = 0;

    console.log(`Iniciando migración de ${portafolios.length} proyectos...`);

    for (const p of portafolios) {
      // Verificamos si el registro ya fue migrado (si es un objeto con subcampo 'es')
      if (p.title && typeof p.title === 'object' && p.title.es) {
        continue; 
      }

      const tituloViejo = typeof p.title === 'string' ? p.title : '';
      const descripcionVieja = typeof p.description === 'string' ? p.description : '';
      const introhomeViejo = typeof p.introhome === 'string' ? p.introhome : descripcionVieja.substring(0, 100);

      // Traducimos los textos viejos en paralelo
      const [traducirTitle, traducirDescription, traducirIntrohome] = await Promise.all([
        translate(tituloViejo, { from: 'es', to: 'en' }).catch(() => ({ text: '' })),
        translate(descripcionVieja, { from: 'es', to: 'en' }).catch(() => ({ text: '' })),
        translate(introhomeViejo, { from: 'es', to: 'en' }).catch(() => ({ text: '' }))
      ]);

      // Guardamos la estructura bilingüe usando actualización directa por ID
      await Portafolio.updateOne(
        { _id: p._id },
        {
          $set: {
            title: { es: tituloViejo, en: traducirTitle.text },
            description: { es: descripcionVieja, en: traducirDescription.text },
            introhome: { es: introhomeViejo, en: traducirIntrohome.text }
          }
        }
      );

      totalMigrados++;
    }

    return res.json({
      ok: true,
      msg: `Migración completada. Se tradujeron ${totalMigrados} proyectos con éxito.`
    });

  } catch (error) {
    console.error('Error crítico en la migración:', error);
    return res.status(500).json({
      ok: false,
      msg: 'Error en el proceso de migración',
      error: error.message
    });
  }
};


module.exports = {
    getPortafolios,
listarPorCategoria,
getPortafolio,
borrarPortafolio,
crearPortafolio,
actualizarPortafolio,
listarPorCategoriaId,
migrarPortafolioBilingue
};