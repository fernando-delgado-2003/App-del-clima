/*
moment.updateLocale('es', {
    months: 'Enero_Febrero_Marzo_Abril_Mayo_Junio_Julio_Agosto_Septiembre_Octubre_Noviembre_Diciembre'.split('_'),
      monthsShort: 'Enero._Feb._Mar_Abr._May_Jun_Jul._Ago_Sept._Oct._Nov._Dec.'.split('_'),
      weekdays: 'Domingo_Lunes_Martes_Miercoles_Jueves_Viernes_Sabado'.split('_'),
      weekdaysShort: 'Dom._Lun._Mar._Mier._Jue._Vier._Sab.'.split('_'),
      weekdaysMin: 'Do_Lu_Ma_Mi_Ju_Vi_Sa'.split('_')
});
*/
moment.locale("es");
const apiKey = "5ea80a3a5da74b767f1e1bd67efdadb8",
	apikeyGeoDataSource = "KJWZNNFWHFTRDADK3CT0AVQ5TZWC7IZ8",
	btnForm = document.querySelector("form button"),
	htmlBtnForm = {
		normal: "<i class='bx bx-search-alt'></i>",
		loader: "<i class='bx bx-loader-alt bx-spin bx-flip-horizontal' ></i>",
	};

const getNameCity = (lat, lon) => {
	return new Promise((resolve, reject) => {
		fetch(
				`https://geodatasource-geodatasource-location-search-web-service-v1.p.rapidapi.com/city?lat=${lat}&key=${apikeyGeoDataSource}&lng=${lon}`,
				{
					method: "GET",
					headers: {
						"x-rapidapi-host": "geodatasource-geodatasource-location-search-web-service-v1.p.rapidapi.com",
						"x-rapidapi-key": "4527db0930msh15fa8c8225abb6bp1ce087jsn33e4fe29efb4",
					},
				}
			)
			.then((res) => res.json())
			.then((data) => {
				if (document.getElementById("city-current")) {
					document.getElementById(
						"city-current"
					).textContent = `${data.city},${data.country}`;
				}
				resolve(data);
			})
			.catch((err) => {
				console.error(err);
			});
	});
};

//FUNCION PARA LA GEOLOCALIZACIÓN
const getGeolocation = () => {
	//OPCIONES
	const options = {
		enableHighAccuracy: true,
		timeout: 5000,
		maximumAge: 0,
	};

	//USUARIO A ACEPTÓ LA GEOLOCALIZACIÓN
	function success(location) {
		btnForm.innerHTML = htmlBtnForm.loader;

		let lat = location.coords.latitude,
			lon = location.coords.longitude,
			city = "";
		getNameCity(lat, lon).then((res) => {
			city = `${res.city},${res.country}`;
		});
		fetch(
				`https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,alerts&units=metric&lang=es&appid=${apiKey}`
			)
			.then((res) => res.json())
			.then((data) => {
				//FUNCIÓN PARA INSERTAR LAS CARDS CON LOS DATOS
				handleCardsWeather(data, city);
			})
			.catch((error) => {
				btnForm.innerHTML = htmlBtnForm.normal;
			});
	}

	//USUARIO NO ACEPTO LA GEOLOCALIZACIÓN
	function error(err) {
		console.log(err);
	}

	navigator.geolocation.getCurrentPosition(success, error, options);
};

//LLAMADO DE LA FUNCIÓN PARA LOCALIZAR AL USUARIO AUTOMATICAMENTE SI LO AUTORIZA
window.addEventListener("DOMContentLoaded", () => {
	const form = document.querySelector(".form");
	getGeolocation();
	form.addEventListener("submit", (e) => {
		e.preventDefault();
		let city = form.querySelector('input[type="text"]').value,
			reg =
			/^[a-zA-ZÀ-ÿ\u00f1\u00d1 ]+(\s*[a-zA-ZÀ-ÿ\u00f1\u00d1 ]*)*[a-zA-ZÀ-ÿ\u00f1\u00d1 ]+$/g;
		if (city.length == 1) {
			message("Bueno, supongo que no hay paises con una sola letra", "warning");
		}
		if (city.length == 0) {
			message("Por favor, no deje el campo vacío", "warning");
		}

		if (reg.test(city)) {
			fetchWeather(city);
		} else {
			message("Por favor, ingrese solo letras de la a a la z", "warning");
		}
	});
});

const fetchWeather = (cityInput) => {
	btnForm.innerHTML = htmlBtnForm.loader;
	let city = "";
	fetch(
			`https://api.openweathermap.org/data/2.5/forecast/daily?q=${cityInput}&cnt=1&appid=${apiKey}`
		)
		.then((res) => res.json())
		.then((data) => {
			if (data.cod == "404") {
				message("El lugar que ingreso no fue encontrado", "warning");
				btnForm.innerHTML = htmlBtnForm.normal;

				return false;
			}
			//RETORNO DE LOS DATOS
			let lat = data.city.coord.lat,
				lon = data.city.coord.lon;

			getNameCity(lat, lon).then((res) => {
				city = `${res.city},${res.country}`;
			});

			fetch(
					`https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,alerts&units=metric&lang=es&appid=${apiKey}`
				)
				.then((res) => res.json())
				.then((datos) => {
					//FUNCIÓN PARA INSERTAR LAS CARDS CON LOS DATOS
					handleCardsWeather(datos, city);
				})
				.catch((error) => {
					btnForm.innerHTML = htmlBtnForm.normal;
				});
		})
		.catch((error) => {
			//leer documentacion para esta parte
			if (error.cod == "404") {
				message("El lugar que ingreso no fue encontrado", "warning");
			}
			btnForm.innerHTML = htmlBtnForm.normal;
		});
};

const handleCardsWeather = (datos, city) => {
	let { daily } = datos,
	current = datos.current,
		templateData = {
			templateCurrent: "",
			templateCurrent2: "",
			templateCurrent3: "",
			templateDays: "",
		};
	daily.forEach((day, i) => {
		if (i == 0) {
			let icon = handleIcon(current.dt * 1000, current.weather[0].id);

			templateData.templateCurrent = `
      			<div class="data">
      				<i class="wi ${icon}"></i>
      				<p class="temp">${parseInt(current.temp)}°c</p>
      				<p class="city" id="city-current">${city != "" ? `${city}` : ``}</p>
      			</div>
      			
      			<div class = "time" >
      				<p>${moment(current.dt * 1000).format("h:mm a")}</p>
      				<p>${current.weather[0].description}</p>
      			</div>
    `;
			templateData.templateCurrent2 += `
    		 <div class="item">
					<div>
						<i class="wi wi-humidity"></i>
						<h4>Humedad</h4>
						<span>${current.humidity}%</span>
					</div>
				</div>
				<div class="item">
					<div>
						<i class="wi wi-day-sunny"></i>
						<h4>Indice UV</h4>
						<span>${parseInt(current.uvi)}/10</span>
					</div>
				</div>
				<div class="item">
					<div>
						<i class="wi wi-sunset"></i>
						<h4>Puesta de sol</h4>
						<span>${moment(current.sunset * 1000).format("h:mm a")}</span>
					</div>
				</div>
				<div class="item">
					<div>
						<i class="wi wi-sunrise"></i>
						<h4>Amanecer</h4>
						<span>${moment(current.sunrise * 1000).format("h:mm a")}</span>
					</div>
				</div>


    `;
			templateData.templateCurrent3 += `
    				<div class="item">
						<div>
							<i class="wi wi-cloud"></i>
							<h4>Nubosidad</h4>
							<span>${current.clouds}%</span>
						</div>
					</div>
					<div class="item">
						<div>
							<img src="img/eye-regular.svg" alt="" />
							<h4>Visibilidad</h4>
							<span>${current.visibility}m</span>
						</div>
					</div>
					<div class="item">
						<div>
							<i class="wi wi-strong-wind"></i>
							<h4>Velocidad del viento</h4>
							<span>${current.wind_speed}m/s</span>
						</div>
					</div>
					<div class="item">
						<div>
							<i class='bx bx-compass'></i>
							<h4>Dirección del viento</h4>
							<p>Dirección <i class="wi wi-wind towards-${current.wind_deg}-deg"></i></p>
						</div>
					</div>
    `;
		} else {
			let icon = handleIcon(day.dt * 1000, day.weather[0].id);

			templateData.templateDays += `
      	<div class="item">
					<button class="btn-modal">
						<i class="wi ${icon}"></i>
						<p>${moment(day.dt * 1000).format("dddd")}</p>
						<i class='bx bx-down-arrow'></i>
					</button>
					<div class="modal">
						<i class="wi ${icon}"></i>
						<p class="description">${day.weather[0].description}</p>
						<div class="data-temp">
							<div class="temp">
								<h4>Temperatura</h4>
          			<p>Maxima: ${parseInt(day.temp.max)}°C</p>
          			<p>Minima: ${parseInt(day.temp.min)}°C</p>
							</div>
							<div class="feels-like">
								<h4>Sensación térmica</h4>
               <p>Mañana: ${parseInt(day.feels_like.day)}°C</p>
               <p>Tarde: ${parseInt(day.feels_like.eve)}°C</p>
               <p>Noche: ${parseInt(day.feels_like.night)}°C</p>
							</div>
						</div>
					</div>
				</div>
      `;
		}
	});
	//return new Promise((resolve, reject)=>{
	//  resolve(templateCards)
	//})
	btnForm.innerHTML = htmlBtnForm.normal;
	document.querySelector(".current-weather > div").innerHTML =
		templateData.templateCurrent;
	document.querySelectorAll(".more-data-weather-current .row")[0].innerHTML =
		templateData.templateCurrent2;
	document.querySelectorAll(".more-data-weather-current .row")[1].innerHTML =
		templateData.templateCurrent3;
	document.querySelector(".weather-days").innerHTML = templateData.templateDays;

	handleAnimationFade();

	toggleModal();
};

const toggleModal = () => {
	let btnModal = document.querySelectorAll(".btn-modal"),
		modals = document.querySelectorAll(".modal");

	btnModal.forEach((btn, i) => {
		btn.addEventListener("click", (e) => {
			let iconArrow = btn.querySelector(".bx-down-arrow");
			modals[i].classList.toggle("active");
			iconArrow.classList.toggle("bx-rotate-180");

			modals.forEach((modal, f) => {
				if (modal != modals[i] && modal.classList.contains("active")) {
					modal.parentNode
						.querySelector("button .bx-down-arrow")
						.classList.remove("bx-rotate-180");
					modal.classList.remove("active");
				}
			});
		});
	});
};
toggleModal();

const handleAnimationFade = () => {
	const fades = document.querySelectorAll(".fade");

	fades.forEach((fade, i) => {
		fade.style.animation = `fadeUp 1.8s forwards`;
		fade.style.animationDelay = `${300 * i}ms`;
	});
};
const handleIcon = (timeStamp, id) => {
	let hour = new Date(timeStamp).getHours();
	if (hour > 6 && hour < 20) {
		//Day time
		dorn = "day-";
	} else {
		//Night time
		dorn = "night-";
	}
	return `wi wi-owm-${dorn}${id}`;
};

const message = (text, type) => {
	const template = `
	<div class="message ${type}" id="message"style="animation: fadeRight 1.5s forwards">
		<p>${text}</p>
		<span class="btn">
			<i class='bx bx-x'></i>
		</span>
	</div>
	`;
	//verificar si un existe el mensaje
	if (!document.getElementById("message")) {
		document.querySelector("main").insertAdjacentHTML("beforeend", template);
	}

	let $message = document.getElementById("message");
	oneSecond = 1000;

	$message.querySelector(".btn").addEventListener("click", () => {
		$message.style.animation = "fadeToRight 1.5s forwards";
		setTimeout(() => {
			$message.remove();
		}, oneSecond + 500);
	});

	setTimeout(() => {
		//verificarsi existe el mensaje
		if (document.getElementById("message")) {
			$message.style.animation = "fadeToRight 1.5s forwards";

			setTimeout(() => {
				$message.remove();
			}, oneSecond + 500);
		}
	}, oneSecond * 7);
};