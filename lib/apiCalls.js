import axios from "axios";
import join from "join-path";

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

export const getFaculty = async id => {
  return await axios.get(join(Bun.env.COMPUTERS, 'faculty', id))
    .then(res => res.data)
    .catch(err => {
      console.error(err);
      return null;
    });
};
