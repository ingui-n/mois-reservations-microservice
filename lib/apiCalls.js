import axios from "axios";
import join from "join-path";

/**
 * request do computer microservice pro unwrapped computer
 * @param id
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
export const getComputerUnwrapped = async id => {
  return await axios.get(join(Bun.env.COMPUTERS, 'computer', id), {
    params: {
      unwrap: true
    }
  })
    .then(res => res.data)
    .catch(err => {
      console.error(err);
      return null;
    });
};

/**
 * request pro získání dat o fakulte z microservice computers podle id
 * @param id
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
export const getFaculty = async id => {
  return await axios.get(join(Bun.env.COMPUTERS, 'faculty', id))
    .then(res => res.data)
    .catch(err => {
      console.error(err);
      return null;
    });
};
